**# TASK #1**

## MAIN TASK

In the current project, there is a folder called `chatbot` that contains an existing chatbot interface connected to a local AI model.

Your task is to integrate this chatbot into the current application's main UI.

Right now, the chatbot renders as a full-screen interface. Change this behavior so it works like a typical website support chatbot:

* Display a floating circular chatbot button in the bottom-right corner of the page.
* The button must stay fixed in that position while scrolling.
* Clicking the button should open a floating chatbot window/panel.
* Clicking the button again, or using a close button inside the panel, should close/minimize the chatbot.
* The chatbot should be named **"Chatbot"** in the interface.
* Preserve the existing chatbot functionality and connection to the local model.

## WHAT TO DO

* Inspect the existing code inside the `chatbot` folder before making changes.
* Understand:

  * How the chatbot UI currently works.
  * How messages are sent.
  * How responses from the local model are received.
  * What components, hooks, APIs, utilities, and dependencies it uses.
* Reuse the existing chatbot logic instead of rewriting working functionality unnecessarily.
* Extract or adapt the current full-screen chatbot UI into a reusable floating chatbot component.
* Add a floating launcher button to the bottom-right corner of the existing page.
* When opened, render the chatbot inside a reasonably sized floating panel.
* The panel should include:

  * Header with the name **"Chatbot"**.
  * Close/minimize control.
  * Message history.
  * Input field.
  * Send functionality.
  * Existing loading/error states if already implemented.
* Keep the conversation state when the chatbot is minimized and reopened during the same page/session.
* Ensure the message area scrolls correctly when messages exceed the available space.
* Automatically scroll toward the latest message when appropriate.
* Make the chatbot responsive:

  * Desktop: floating box in the bottom-right corner.
  * Mobile/small screens: adapt the width/height so it remains usable without overflowing the viewport.
* Make sure the chatbot appears above the rest of the application using an appropriate `z-index`.
* Preserve the design system, styling conventions, components, and technologies already used by the current project.
* If the existing chatbot has its own styling, adapt it so it visually fits the current application.
* Ensure opening or closing the chatbot does not reload the page.
* Verify that the existing local-model integration still works after the UI changes.
* Run the project's existing lint, type-check, build, and/or test commands after completing the integration.
* Fix any issues introduced by the implementation.
* Move code where needed and restructure code on codebase

## EXPECTED BEHAVIOR

Default state:

```text
                                   ●
                              Chatbot button
```

When clicked:

```text
                    ┌─────────────────────────┐
                    │ Chatbot              ✕ │
                    ├─────────────────────────┤
                    │                         │
                    │ Conversation history    │
                    │                         │
                    │                         │
                    ├─────────────────────────┤
                    │ Message...        Send │
                    └─────────────────────────┘
                              ●
```

The exact design does not need to match this diagram. Follow the application's existing visual style.

## WHAT NOT TO DO

* Do not remove or break the existing chatbot/local-model integration.
* Do not rewrite the chatbot backend or model communication logic unless it is necessary for the integration.
* Do not leave the chatbot as a full-screen page.
* Do not create a completely separate duplicate chatbot implementation if the existing one can be reused.
* Do not introduce unnecessary dependencies.
* Do not modify unrelated features or pages.
* Do not change existing APIs, request formats, or response formats unless absolutely necessary.
* Do not hardcode mock chatbot responses.
* Do not remove existing error handling or loading states.
* Do not make the chatbot panel block interaction with the entire application when it is minimized.
* Do not sacrifice mobile responsiveness.
* Do not consider the task complete only because the UI renders; verify that actual messages can still be sent to and received from the local model.

## FINAL VERIFICATION

Before considering the task complete, verify:

1. The chatbot launcher appears in the bottom-right corner.
2. Clicking it opens the chatbot panel.
3. The panel can be closed/minimized.
4. The chatbot is labeled **"Chatbot"**.
5. Existing conversation functionality works.
6. The local model still receives messages and returns responses.
7. Conversation state is preserved when minimizing/reopening.
8. The message list scrolls correctly.
9. The UI works on desktop and mobile-sized screens.
10. No unrelated functionality was broken.
11. The project builds successfully without new lint/type errors.

## FEEDBACK

If you encounter a genuine ambiguity, missing dependency, or architectural decision that cannot be resolved by inspecting the current project and the `chatbot` folder, feel free to ask me via the Claude Code terminal.

Otherwise, make the best implementation decision based on the existing project structure and continue without asking unnecessary questions.
