const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const router = require("../dist/routes/chat.routes").default;

test("accessory selection reaches order review and Go Back restores choices", async () => {
  // Exercise the deterministic shopping flow without external AI requests.
  delete process.env.GEMINI_API_KEY;
  const app = express();
  app.use(express.json());
  app.use("/chat", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/chat`;
  const post = async (path, body) => {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    return result.data;
  };
  try {
    const start = await post("", { message: "Shop Accessories" });
    const choices = await post("", { sessionId: start.sessionId, message: "Bow Ties" });
    assert.equal(choices.stage, "ready_for_recommendations");
    const product = choices.recommendations.find(
      ({ product }) => product.name === "Ruby Luxe Bow Tie",
    )?.product;
    assert.ok(product, "Ruby Luxe Bow Tie must be offered");
    const selected = await post("", {
      sessionId: start.sessionId,
      message: `I select product ID ${product.id}: ${product.name}`,
    });
    assert.equal(selected.stage, "review_tailored_order");
    assert.equal(selected.requirements.selectedProductId, product.id);
    assert.equal(selected.requirements.selectedProductName, product.name);
    assert.equal(selected.expectedField, null);
    assert.equal(selected.recommendations.length, 0);
    const restored = await post("/restore", {
      sessionId: start.sessionId,
      checkpointId: selected.checkpoint.id,
    });
    assert.equal(restored.stage, "ready_for_recommendations");
    assert.equal(restored.requirements.selectedProductId, null);
    assert.ok(restored.recommendations.length > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
