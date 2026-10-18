export function compressImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法处理图片"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

export function extractDominantColor(imgSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 20;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法处理图片"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      const counts = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue;
        const key = `${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b / 32)}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

      let maxKey = "";
      let maxCount = 0;
      for (const [key, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          maxKey = key;
        }
      }

      if (!maxKey) {
        reject(new Error("无法提取颜色"));
        return;
      }

      const [r, g, b] = maxKey.split(",").map(Number);
      const toHex = (v: number) => (v * 32 + 16).toString(16).padStart(2, "0");
      resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = imgSrc;
  });
}
