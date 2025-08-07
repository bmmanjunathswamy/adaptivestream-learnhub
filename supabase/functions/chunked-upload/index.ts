import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`${req.method} request received`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Supabase key exists:', !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client created')

    // Parse form data
    console.log('Parsing form data...')
    const formData = await req.formData()
    
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const uploadId = formData.get('uploadId') as string

    console.log('Form data parsed:', {
      hasChunk: !!chunk,
      chunkIndex,
      totalChunks,
      fileName,
      uploadId,
      chunkSize: chunk?.size
    })

    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !uploadId) {
      const error = 'Missing or invalid required fields'
      console.error(error)
      throw new Error(error)
    }

    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} for file ${fileName}`)

    // Store chunk with simple path
    const chunkPath = `temp/${uploadId}/${chunkIndex}`
    console.log(`Uploading chunk to: ${chunkPath}`)
    
    const { error: chunkError } = await supabase.storage
      .from('videos')
      .upload(chunkPath, chunk, {
        cacheControl: '3600',
        upsert: true
      })

    if (chunkError) {
      console.error('Chunk upload error:', chunkError)
      throw new Error(`Chunk upload failed: ${chunkError.message}`)
    }

    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`)

    // If this is the last chunk, combine all chunks
    if (chunkIndex === totalChunks - 1) {
      console.log('Last chunk received, starting file combination...')
      
      try {
        const chunks: Uint8Array[] = []
        let totalSize = 0
        
        // Download all chunks
        for (let i = 0; i < totalChunks; i++) {
          const chunkFileName = `temp/${uploadId}/${i}`
          console.log(`Downloading chunk ${i + 1}/${totalChunks}: ${chunkFileName}`)
          
          const { data: chunkData, error: downloadError } = await supabase.storage
            .from('videos')
            .download(chunkFileName)
          
          if (downloadError) {
            console.error(`Error downloading chunk ${i}:`, downloadError)
            throw new Error(`Failed to download chunk ${i}: ${downloadError.message}`)
          }
          
          const arrayBuffer = await chunkData.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          chunks.push(uint8Array)
          totalSize += uint8Array.length
          
          console.log(`Chunk ${i + 1} downloaded: ${uint8Array.length} bytes`)
        }

        console.log(`All chunks downloaded. Total size: ${totalSize} bytes`)

        // Combine chunks
        const combinedArray = new Uint8Array(totalSize)
        let offset = 0
        
        for (let i = 0; i < chunks.length; i++) {
          combinedArray.set(chunks[i], offset)
          offset += chunks[i].length
          console.log(`Combined chunk ${i + 1}, offset now: ${offset}`)
        }

        // Upload final file
        const finalPath = `original/${fileName}`
        console.log(`Uploading final file: ${finalPath}`)

        const { error: finalUploadError } = await supabase.storage
          .from('videos')
          .upload(finalPath, combinedArray, {
            cacheControl: '3600',
            upsert: true
          })

        if (finalUploadError) {
          console.error('Final upload error:', finalUploadError)
          throw new Error(`Final upload failed: ${finalUploadError.message}`)
        }

        console.log('Final file uploaded successfully')

        // Clean up temporary chunks
        console.log('Cleaning up temporary chunks...')
        const chunksToDelete = []
        for (let i = 0; i < totalChunks; i++) {
          chunksToDelete.push(`temp/${uploadId}/${i}`)
        }
        
        const { error: deleteError } = await supabase.storage
          .from('videos')
          .remove(chunksToDelete)
          
        if (deleteError) {
          console.warn('Warning: Failed to clean up some chunks:', deleteError)
        } else {
          console.log('Temporary chunks cleaned up')
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(finalPath)

        console.log('Upload process completed successfully')

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
      } catch (combineError) {
        console.error('Error in combination process:', combineError)
        throw combineError
      }
    }

    // Return success for individual chunk
    const response = {
      success: true, 
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
      chunkIndex
    }
    
    console.log('Returning success response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Function error:', errorMessage)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process upload',
        details: errorMessage
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