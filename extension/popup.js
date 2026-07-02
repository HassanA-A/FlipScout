const endpointInput = document.getElementById("endpoint");
const goBtn = document.getElementById("go");
const resultEl = document.getElementById("result");

chrome.storage.sync.get({ endpoint: "http://localhost:3000" }, ({ endpoint }) => {
  endpointInput.value = endpoint;
});
endpointInput.addEventListener("change", () => {
  chrome.storage.sync.set({ endpoint: endpointInput.value });
});

goBtn.addEventListener("click", async () => {
  goBtn.disabled = true;
  resultEl.textContent = "Capturing page…";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result: capture }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["capture.js"],
    });

    if (!capture?.title || capture.price === null) {
      resultEl.textContent =
        "Couldn't find a title/price on this page. Open a specific listing and try again.";
      return;
    }

    resultEl.textContent = `Analyzing "${capture.title}" at $${capture.price}…`;
    const res = await fetch(`${endpointInput.value}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capture),
    });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const { analysis, watchlistHits } = await res.json();

    const cls = analysis.verdict === "pass" ? "pass" : "buy";
    resultEl.innerHTML =
      `<span class="${cls}">${analysis.verdict.toUpperCase()} · score ${analysis.score}</span>\n` +
      `Est. value $${analysis.estValue} · profit ${analysis.estProfit >= 0 ? "+" : ""}$${analysis.estProfit}\n` +
      `${analysis.reasoning}\n` +
      (watchlistHits.length ? `🔔 Watchlist: ${watchlistHits.join(", ")}\n` : "") +
      `Saved to your board.`;
  } catch (err) {
    resultEl.textContent = `Failed: ${err.message}. Is FlipScout running at ${endpointInput.value}?`;
  } finally {
    goBtn.disabled = false;
  }
});
