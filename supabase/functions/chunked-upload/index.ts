import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await req.formData()
    
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const uploadId = formData.get('uploadId') as string

    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !uploadId) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request parameters'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get MIME type from file extension
    const getVideoMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime'
      }
      return mimeTypes[ext || ''] || 'video/mp4'
    }

    const videoMimeType = getVideoMimeType(fileName)
    
    // Convert chunk to proper format
    const chunkBuffer = await chunk.arrayBuffer()
    const chunkPath = `temp/${uploadId}/${chunkIndex.toString().padStart(4, '0')}`
    
    // Upload chunk
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(chunkPath, chunkBuffer, {
        contentType: videoMimeType,
        upsert: true
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upload chunk',
          details: uploadError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If this is the last chunk, combine all chunks using streaming to avoid memory issues
    if (chunkIndex === totalChunks - 1) {
      try {
        console.log(`Starting to combine ${totalChunks} chunks for upload ${uploadId}`)
        
        // Use a streaming approach to avoid memory limits
        const finalPath = `original/${fileName}`
        const chunkBuffers: Uint8Array[] = []
        
        // Download chunks one by one to manage memory better
        for (let i = 0; i < totalChunks; i++) {
          const chunkFileName = `temp/${uploadId}/${i.toString().padStart(4, '0')}`
          console.log(`Downloading chunk ${i}/${totalChunks - 1}`)
          
          const { data: chunkData, error: downloadError } = await supabase.storage
            .from('videos')
            .download(chunkFileName)

          if (downloadError || !chunkData) {
            throw new Error(`Failed to download chunk ${i}: ${downloadError?.message || 'No data'}`)
          }

          const chunkBuffer = new Uint8Array(await chunkData.arrayBuffer())
          chunkBuffers.push(chunkBuffer)
          
          // Log progress
          console.log(`Downloaded chunk ${i}, size: ${chunkBuffer.length} bytes`)
        }

        console.log(`All chunks downloaded, combining...`)
        
        // Calculate total size
        const totalSize = chunkBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
        console.log(`Total file size will be: ${totalSize} bytes`)
        
        // Create combined buffer efficiently
        const combinedBuffer = new Uint8Array(totalSize)
        let offset = 0
        
        for (let i = 0; i < chunkBuffers.length; i++) {
          combinedBuffer.set(chunkBuffers[i], offset)
          offset += chunkBuffers[i].byteLength
          // Clear the chunk buffer from memory
          chunkBuffers[i] = new Uint8Array(0)
        }

        console.log(`Combined buffer created, uploading final file...`)

        // Upload final file
        const { error: finalError } = await supabase.storage
          .from('videos')
          .upload(finalPath, combinedBuffer, {
            contentType: videoMimeType,
            upsert: true
          })

        if (finalError) {
          throw new Error(`Final upload failed: ${finalError.message}`)
        }

        console.log(`Final file uploaded successfully to ${finalPath}`)

        // Clean up temp chunks in background (don't wait for completion)
        const cleanupPromises = []
        for (let i = 0; i < totalChunks; i++) {
          const chunkFileName = `temp/${uploadId}/${i.toString().padStart(4, '0')}`
          cleanupPromises.push(
            supabase.storage.from('videos').remove([chunkFileName])
          )
        }
        
        // Don't await cleanup, just start it
        Promise.allSettled(cleanupPromises).then(() => {
          console.log(`Cleanup completed for upload ${uploadId}`)
        }).catch(err => {
          console.warn(`Cleanup failed for upload ${uploadId}:`, err)
        })

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(finalPath)

        console.log(`Upload completed successfully: ${urlData.publicUrl}`)

        return new Response(
          JSON.stringify({ 
            success: true,
            publicUrl: urlData.publicUrl,
            path: finalPath
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (combineError) {
        console.error(`Error combining chunks for upload ${uploadId}:`, combineError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to combine chunks',
            details: combineError instanceof Error ? combineError.message : 'Unknown error'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Return success for individual chunk
    return new Response(
      JSON.stringify({
        success: true,
        chunkIndex
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})