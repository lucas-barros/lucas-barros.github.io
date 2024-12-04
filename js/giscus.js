((window, document) => {
  const addUrl = (url) => {
    const anchor = document.getElementById("giscus_warning_link");

    if (anchor) {
      anchor.href = url;
      anchor.innerHTML = url;
    }
  };
  const displayWarning = () => {
    const warning = document.getElementById("giscus_warning");

    if (warning) {
      warning.style.display = "block";
    }
  };
  const handleMessage = (event) => {
    if (event.origin !== "https://giscus.app") return;
    if (!(typeof event.data === "object" && event.data.giscus)) return;

    const data = event.data.giscus;

    if (data.discussion?.url) {
      addUrl(data.discussion.url);
      displayWarning();
      window.removeEventListener(handleMessage);
    }
  };

  window.addEventListener("message", handleMessage);
})(window, document);
