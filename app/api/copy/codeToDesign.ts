const codeToDesign = async (html: string, css: string) => {
  const response = await fetch("https://api.to.design/html", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.CODE_TO_DESIGN_API_KEY}`,
    },
    body: JSON.stringify({ html: `<style>${css}</style>${html}`, clip: true }),
  });

  const clipboardDataFromAPI = await response.text();
  return { clipboardDataFromAPI };
};

export default codeToDesign;
