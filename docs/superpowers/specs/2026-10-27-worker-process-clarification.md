# Worker-process clarification

The owner clarifies that pipeline diagrams depict executable worker programs running as distinct processes, rather than only a sequence-flow diagram. This supersedes the website's earlier one-process-per-pipeline framing.

Use Receive.exe, Validate.exe, Price.exe, Persist.exe and Respond.exe in the business-language diagram and the system map. Explain document hand-offs between those processes. Keep the surrounding language/hardware-agnostic intent: .exe is an illustrative Windows filename, while workers on other platforms and devices can fulfil the same contracts. The runtime remains planned work, separate from the current UI prototype.

Align the hand-off FAQ and the existing content-preservation check with this clarification. Preserve the icon-left layout and responsive rendering.
