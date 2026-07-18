declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // If the script is already loaded, resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
