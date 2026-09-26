// Shrinks a chosen photo before upload and re-saves it as a JPEG.
// Re-drawing the image onto a canvas also drops the photo's hidden metadata
// (EXIF), which on phones can include the exact GPS location where the
// picture was taken. That matters for an ID photo.
export function readAndResizeImage(file, maxDim = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      reject(new Error("Please choose a photo (an image file)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a readable image."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Resize a photo so it fits under a size limit, stepping quality and size
// down until it does. The server has hard caps per photo; this makes sure a
// normal phone photo always fits instead of being refused.
export async function fitImage(file, { maxDim, maxChars }) {
  const attempts = [[maxDim, 0.85], [maxDim, 0.7], [Math.round(maxDim * 0.8), 0.7], [Math.round(maxDim * 0.6), 0.65]];
  let last = null;
  for (const [dim, q] of attempts) {
    last = await readAndResizeImage(file, dim, q);
    if (last.length <= maxChars) return last;
  }
  throw new Error("That photo is too large even after shrinking. Please try a different one.");
}
