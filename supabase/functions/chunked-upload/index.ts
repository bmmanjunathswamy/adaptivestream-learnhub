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

    // If this is the last chunk, combine all chunks using true streaming to avoid memory issues
    if (chunkIndex === totalChunks - 1) {
      try {
        console.log(`Starting to combine ${totalChunks} chunks for upload ${uploadId}`)
        
        const finalPath = `original/${fileName}`
        
        // Create a streaming upload by processing chunks in smaller batches
        const BATCH_SIZE = 5 // Process 5 chunks at a time to manage memory
        const tempChunkPaths: string[] = []
        
        // First, verify all chunks exist
        for (let i = 0; i < totalChunks; i++) {
          tempChunkPaths.push(`temp/${uploadId}/${i.toString().padStart(4, '0')}`)
        }
        
        // Process chunks in batches and create intermediate files
        const intermediatePaths: string[] = []
        
        for (let batchStart = 0; batchStart < totalChunks; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, totalChunks)
          const batchChunks: Uint8Array[] = []
          
          console.log(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(totalChunks / BATCH_SIZE)}`)
          
          // Download and combine chunks in current batch
          for (let i = batchStart; i < batchEnd; i++) {
            const { data: chunkData, error: downloadError } = await supabase.storage
              .from('videos')
              .download(tempChunkPaths[i])

            if (downloadError || !chunkData) {
              throw new Error(`Failed to download chunk ${i}: ${downloadError?.message || 'No data'}`)
            }

            const chunkBuffer = new Uint8Array(await chunkData.arrayBuffer())
            batchChunks.push(chunkBuffer)
          }
          
          // Combine batch chunks
          const batchSize = batchChunks.reduce((sum, buffer) => sum + buffer.byteLength, 0)
          const batchBuffer = new Uint8Array(batchSize)
          let offset = 0
          
          for (const chunk of batchChunks) {
            batchBuffer.set(chunk, offset)
            offset += chunk.byteLength
          }
          
          // Upload intermediate batch file
          const intermediatePath = `temp/${uploadId}/batch_${Math.floor(batchStart / BATCH_SIZE)}`
          const { error: batchError } = await supabase.storage
            .from('videos')
            .upload(intermediatePath, batchBuffer, {
              contentType: 'application/octet-stream',
              upsert: true
            })
            
          if (batchError) {
            throw new Error(`Failed to upload batch: ${batchError.message}`)
          }
          
          intermediatePaths.push(intermediatePath)
          console.log(`Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} uploaded, size: ${batchSize} bytes`)
        }
        
        // Now combine all intermediate files into final file
        console.log(`Combining ${intermediatePaths.length} intermediate files...`)
        
        const finalChunks: Uint8Array[] = []
        for (const intermediatePath of intermediatePaths) {
          const { data: intermediateData, error: downloadError } = await supabase.storage
            .from('videos')
            .download(intermediatePath)
            
          if (downloadError || !intermediateData) {
            throw new Error(`Failed to download intermediate file: ${downloadError?.message || 'No data'}`)
          }
          
          finalChunks.push(new Uint8Array(await intermediateData.arrayBuffer()))
        }
        
        // Create final buffer
        const totalSize = finalChunks.reduce((sum, buffer) => sum + buffer.byteLength, 0)
        const finalBuffer = new Uint8Array(totalSize)
        let finalOffset = 0
        
        for (const chunk of finalChunks) {
          finalBuffer.set(chunk, finalOffset)
          finalOffset += chunk.byteLength
        }
        
        console.log(`Final buffer created, size: ${totalSize} bytes. Uploading...`)

        // Upload final file
        const { error: finalError } = await supabase.storage
          .from('videos')
          .upload(finalPath, finalBuffer, {
            contentType: videoMimeType,
            upsert: true
          })

        if (finalError) {
          throw new Error(`Final upload failed: ${finalError.message}`)
        }

        console.log(`Final file uploaded successfully to ${finalPath}`)

        // Clean up temp chunks and intermediate files in background
        const cleanupPromises = []
        
        // Remove original chunks
        for (let i = 0; i < totalChunks; i++) {
          const chunkFileName = `temp/${uploadId}/${i.toString().padStart(4, '0')}`
          cleanupPromises.push(
            supabase.storage.from('videos').remove([chunkFileName])
          )
        }
        
        // Remove intermediate batch files
        for (const intermediatePath of intermediatePaths) {
          cleanupPromises.push(
            supabase.storage.from('videos').remove([intermediatePath])
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