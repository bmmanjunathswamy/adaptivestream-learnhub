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
    const { videoId, originalFileUrl } = await req.json();
    
    console.log(`Starting FFmpeg video processing for video ID: ${videoId}`);
    console.log(`Original file URL: ${originalFileUrl}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update video status to processing
    await supabase
      .from('videos')
      .update({ processing_status: 'processing' })
      .eq('id', videoId);

    // Background processing with FFmpeg
    const processVideoWithFFmpeg = async () => {
      try {
        console.log('Starting background video processing...');
        
        // Download the original video file
        const response = await fetch(originalFileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`);
        }
        
        const videoBuffer = await response.arrayBuffer();
        const tempInputPath = `/tmp/input_${videoId}.mp4`;
        const tempOutputPath = `/tmp/output_${videoId}`;
        
        // Write input file
        await Deno.writeFile(tempInputPath, new Uint8Array(videoBuffer));
        
        // Create output directory
        await Deno.mkdir(tempOutputPath, { recursive: true });
        
        // FFmpeg command to create DASH with multiple bitrates
        const ffmpegCmd = [
          'ffmpeg',
          '-i', tempInputPath,
          '-c:v', 'libx264',
          '-profile:v', 'high',
          '-level', '4.0',
          '-c:a', 'aac',
          '-ar', '48000',
          '-ac', '2',
          '-map', '0:v:0', '-map', '0:a:0',
          '-b:v:0', '400k', '-s:v:0', '640x360',
          '-map', '0:v:0', '-map', '0:a:0',
          '-b:v:1', '800k', '-s:v:1', '854x480',
          '-map', '0:v:0', '-map', '0:a:0',
          '-b:v:2', '1200k', '-s:v:2', '1280x720',
          '-map', '0:v:0', '-map', '0:a:0',
          '-b:v:3', '2000k', '-s:v:3', '1920x1080',
          '-b:a', '128k',
          '-f', 'dash',
          '-seg_duration', '4',
          '-use_template', '1',
          '-use_timeline', '1',
          '-init_seg_name', 'init-$RepresentationID$.m4s',
          '-media_seg_name', 'chunk-$RepresentationID$-$Number$.m4s',
          `${tempOutputPath}/manifest.mpd`
        ];
        
        console.log('Running FFmpeg command:', ffmpegCmd.join(' '));
        
        const process = new Deno.Command('ffmpeg', {
          args: ffmpegCmd.slice(1),
          stdout: 'piped',
          stderr: 'piped'
        });
        
        const { code, stdout, stderr } = await process.output();
        
        if (code !== 0) {
          const errorText = new TextDecoder().decode(stderr);
          console.error('FFmpeg error:', errorText);
          throw new Error(`FFmpeg failed with code ${code}: ${errorText}`);
        }
        
        console.log('FFmpeg processing completed successfully');
        
        // Upload processed files to storage
        const manifestPath = `${tempOutputPath}/manifest.mpd`;
        const manifestContent = await Deno.readFile(manifestPath);
        
        // Upload manifest file
        const manifestUpload = await supabase.storage
          .from('videos')
          .upload(`processed/${videoId}/manifest.mpd`, manifestContent, {
            contentType: 'application/dash+xml'
          });
        
        if (manifestUpload.error) {
          throw new Error(`Failed to upload manifest: ${manifestUpload.error.message}`);
        }
        
        // Upload all segment files
        const outputDir = await Deno.readDir(tempOutputPath);
        for await (const entry of outputDir) {
          if (entry.isFile && (entry.name.endsWith('.m4s') || entry.name.endsWith('.mp4'))) {
            const segmentContent = await Deno.readFile(`${tempOutputPath}/${entry.name}`);
            await supabase.storage
              .from('videos')
              .upload(`processed/${videoId}/${entry.name}`, segmentContent);
          }
        }
        
        // Get public URLs
        const { data: manifestUrl } = supabase.storage
          .from('videos')
          .getPublicUrl(`processed/${videoId}/manifest.mpd`);
        
        // Update video record with DASH URLs
        const updateResult = await supabase
          .from('videos')
          .update({
            dash_manifest_url: manifestUrl.publicUrl,
            processing_status: 'completed'
          })
          .eq('id', videoId);
        
        if (updateResult.error) {
          throw new Error(`Failed to update video record: ${updateResult.error.message}`);
        }
        
        console.log(`Video processing completed for ${videoId}`);
        
        // Cleanup temp files
        try {
          await Deno.remove(tempInputPath);
          await Deno.remove(tempOutputPath, { recursive: true });
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
        
      } catch (error) {
        console.error('Background processing error:', error);
        
        // Update video status to failed
        await supabase
          .from('videos')
          .update({ processing_status: 'failed' })
          .eq('id', videoId);
      }
    };

    // Start background processing
    EdgeRuntime.waitUntil(processVideoWithFFmpeg());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Video processing started with FFmpeg',
        videoId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error starting video processing:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to start video processing',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});