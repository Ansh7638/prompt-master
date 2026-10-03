# Prompt Master — Funny Questions upgrade

Adds a selectable **Funny Questions** category with 20 clean jokes, puns, and trick questions. The existing 2-player room-code and WebSocket structure is retained.

## Files
- `server.js`
- `package.json`
- `public/index.html`

## Safe rollout
1. Back up your current repository first.
2. Upload these files to a separate Git branch if possible.
3. Test using a separate Render service before updating the live service.
4. Only update the live service after both players can create/join a room and finish a game.

The room creator selects the quiz category; both players receive that room's questions. “Mixed Quiz” preserves mixed-category play. This update does not yet implement accounts, persistent profiles, matchmaking, or tournaments.
