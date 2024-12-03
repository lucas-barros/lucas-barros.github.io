const codeEditor = ((document, ace) => {
  const init = (id, mode) => {
    const editor = ace.edit(id);
    editor.setTheme("ace/theme/tomorrow_night");
    editor.session.setMode(mode);

    configureWorker(editor);
  };

  const configureWorker = (editor) => {
    const worker = editor.session.$worker;
    if (!worker) {
      setTimeout(() => configureWorker(editor), 500);
    } else {
      worker.call("setOptions", [
        { esversion: 11, unstable: { bigint: true } },
      ]);
    }
  };

  const runCode = async (id) => {
    const editor = ace.edit(`editor_content_${id}`);
    const code = editor.getValue();
    const outputElement = document.getElementById(`editor_result_${id}`);
    const buttonElement = document.getElementById(`editor_button_${id}`);
    buttonElement.setAttribute("disabled", true);
    try {
      const result = await eval(code);
      outputElement.textContent = result ?? "Code executed successfully.";
    } catch (error) {
      outputElement.textContent = `Error: ${error.message}`;
    } finally {
      buttonElement.removeAttribute("disabled");
    }
  };

  return {
    init,
    runCode,
  };
})(window.document, window.ace);
