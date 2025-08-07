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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await req.formData()
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const uploadId = formData.get('uploadId') as string

    if (!chunk || !fileName || !uploadId) {
      throw new Error('Missing required fields')
    }

    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} for file ${fileName}`)

    // Store chunk temporarily
    const chunkPath = `temp/${uploadId}/chunk_${chunkIndex}`
    
    const { error: chunkError } = await supabase.storage
      .from('videos')
      .upload(chunkPath, chunk, {
        cacheControl: '3600',
        upsert: true
      })

    if (chunkError) {
      console.error('Chunk upload error:', chunkError)
      throw chunkError
    }

    // If this is the last chunk, combine all chunks
    if (chunkIndex === totalChunks - 1) {
      console.log('Last chunk received, combining chunks...')
      
      // Create a stream to combine chunks without loading everything into memory
      const chunks: Uint8Array[] = []
      let totalSize = 0
      
      for (let i = 0; i < totalChunks; i++) {
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('videos')
          .download(`temp/${uploadId}/chunk_${i}`)
        
        if (downloadError) {
          console.error(`Error downloading chunk ${i}:`, downloadError)
          throw downloadError
        }
        
        const arrayBuffer = await chunkData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        chunks.push(uint8Array)
        totalSize += uint8Array.length
      }

      // Create combined array buffer
      const combinedArray = new Uint8Array(totalSize)
      let offset = 0
      
      for (const chunk of chunks) {
        combinedArray.set(chunk, offset)
        offset += chunk.length
      }

      // Create blob from combined array
      const combinedBlob = new Blob([combinedArray])
      const finalPath = `original/${fileName}`

      console.log(`Uploading final file: ${finalPath}, size: ${totalSize} bytes`)

      const { error: finalUploadError } = await supabase.storage
        .from('videos')
        .upload(finalPath, combinedBlob, {
          cacheControl: '3600',
          upsert: true
        })

      if (finalUploadError) {
        console.error('Final upload error:', finalUploadError)
        throw finalUploadError
      }

      // Clean up temporary chunks
      console.log('Cleaning up temporary chunks...')
      for (let i = 0; i < totalChunks; i++) {
        await supabase.storage
          .from('videos')
          .remove([`temp/${uploadId}/chunk_${i}`])
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(finalPath)

      console.log('Upload completed successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Upload completed',
          publicUrl: urlData.publicUrl,
          path: finalPath
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Return chunk upload success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
        chunkIndex
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in chunked upload:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process upload',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})