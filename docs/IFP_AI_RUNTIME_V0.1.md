# IFP AI Runtime V0.1

## Scope

Private **IFP Expert Cockpit** for Martyna. The public homepage and current IFP preview remain unchanged.

### UI
- one chat surface
- `CHAT / AGENT`
- provider selector: AUTO / NVIDIA / OpenRouter
- quick workspaces: materials, mentoring, report, plan, document, EU funding
- small scoped browser memory
- runtime inspector + APR receipt

### Runtime

```
Cockpit
  -> /api/cockpit
      -> code authority gate
      -> Jev Decisions route (OpenRouter)
      -> provider mesh
          -> NVIDIA NIM
          -> OpenRouter chat
      -> APR-style execution receipt
```

## Jev

Current pinned model: `typesafe/jev-1.13`.

Jev performs only bounded decisions:
- workflow routing
- probability that request contains an external side effect
- probability that expert review is required

It does **not** write the final answer and it does **not** execute tools.

If `OPENROUTER_API_KEY` is missing, the runtime uses an explicit deterministic fallback router and marks the route source as fallback.

## Provider mesh

### NVIDIA
- endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
- default model: `openai/gpt-oss-120b`

### OpenRouter
- chat endpoint: `https://openrouter.ai/api/v1/chat/completions`
- default model: `openai/gpt-oss-120b:free`
- Jev Decisions endpoint: `https://openrouter.ai/api/alpha/decisions`

## Environment

```
OPENROUTER_API_KEY=
OPENROUTER_CHAT_MODEL=openai/gpt-oss-120b:free
JEV_MODEL=typesafe/jev-1.13

NVIDIA_API_KEY=
NVIDIA_MODEL=openai/gpt-oss-120b
```

Keys are server-side only. The browser never receives them.

## Authority

V0.1 is intentionally non-destructive:
- analysis: allowed
- drafts: allowed
- translation: allowed
- document generation: allowed
- external send/publish/submit/delete/purchase: REVIEW_REQUIRED and not executed

## Memory

V0.1 uses a deliberately small local memory:
- max 6 recent user entries
- stored in browser `localStorage`
- can be disabled or cleared
- no cross-client database yet

This is a preview/runtime slice, not the final persistent client memory architecture.

## APR receipt

Every run records:
- execution id
- selected workflow
- route source + Jev confidence
- provider + model
- authority result
- input/output SHA-256 digests
- latency
- provider errors when fallback occurred

## Next production gates

1. Add real provider keys to Vercel environment.
2. Run 10–20 labeled routing prompts and compare Jev decisions with human labels.
3. Connect IFP Knowledge Core with source citations.
4. Add real admin authentication before treating the cockpit as private production.
5. Add official funding data connectors before claiming live grant discovery.
