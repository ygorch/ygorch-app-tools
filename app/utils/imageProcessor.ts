import imageCompression from 'browser-image-compression';

export interface ImageProcessOptions {
  type: 'resize' | 'compress';
  resizeTarget?: 'small' | 'medium' | 'large';
  compressTarget?: '200kb' | '500kb' | '1mb' | '2mb';
}

const MAX_WIDTHS = {
  small: 840,
  medium: 1280,
  large: 2880,
};

const TARGET_SIZES_MB = {
  '200kb': 0.2,
  '500kb': 0.5,
  '1mb': 1,
  '2mb': 2,
};

export async function processImage(file: File, options: ImageProcessOptions): Promise<File> {
  if (options.type === 'resize' && options.resizeTarget) {
    const maxWidth = MAX_WIDTHS[options.resizeTarget];

    // Check if we need to resize
    const image = await createImageBitmap(file);
    if (image.width <= maxWidth) {
      // If already smaller, just return the file or maybe convert to ensure consistency?
      // User requirement implies "reducing", so if it's already smaller, we probably shouldn't upscale.
      // But we should probably ensure it's a "processed" output.
      // Let's compress slightly to ensure it's optimized if user wants to reduce.
      // But specifically for "Resize", we usually care about dimensions.
      // Let's use browser-image-compression for resizing too as it handles canvas drawing well.

      const opts = {
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        initialQuality: 1.0, // Keep quality high if just resizing
      };
      return await imageCompression(file, opts);
    }

    const opts = {
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
      initialQuality: 0.9,
    };

    return await imageCompression(file, opts);
  }

  if (options.type === 'compress' && options.compressTarget) {
    const targetMB = TARGET_SIZES_MB[options.compressTarget];

    const opts = {
      maxSizeMB: targetMB,
      useWebWorker: true,
      initialQuality: 1.0, // Start high and let the library reduce
      alwaysKeepResolution: true, // Try to keep resolution if possible, or should we reduce it?
      // "estimate dimensions that these images will stay to meet this weight requirement"
      // This implies we might need to reduce dimensions to hit the target weight.
      // browser-image-compression reduces resolution if needed to hit maxSizeMB.
    };

    return await imageCompression(file, opts);
  }

  throw new Error("Invalid options");
}

export async function estimateDimensionsForCompression(file: File, targetLabel: string): Promise<string> {
  // This is a rough estimation. Accurately predicting dimensions for a target size is hard without actually doing it.
  // However, we can try a heuristic or actually run a quick trial.
  // Given the requirement "give estimates of dimensions", we might need to do a trial run or math.

  // Running a trial might be slow for large images.
  // Let's try to do a very fast heuristic:
  // If we reduce quality to 0.7, what size do we get?
  // If we assume a certain bytes-per-pixel ratio.

  // A safer bet to be "accurate" as requested is to actually run the compression.
  // Since it's client side, we can try to compress.

  try {
    const targetMB = TARGET_SIZES_MB[targetLabel as keyof typeof TARGET_SIZES_MB];
    const opts = {
      maxSizeMB: targetMB,
      useWebWorker: true,
      maxIteration: 5, // limit iterations for speed
    };

    const compressedFile = await imageCompression(file, opts);
    const bitmap = await createImageBitmap(compressedFile);
    return `${bitmap.width}x${bitmap.height}`;
  } catch (error) {
    console.error("Error estimating dimensions", error);
    return "Unknown";
  }
}
