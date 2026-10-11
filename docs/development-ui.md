# Development UI testing

The timer is always the real, backend-authoritative eight-minute countdown. It accumulates only during an acknowledged active gameplay view and pauses automatically during handoff, queue waiting, station reset and reconnect recovery. Refreshing or moving between devices cannot extend or indefinitely pause an active mission. There is no participant timer control.

The exit confirmation uses a body portal and native `dialog.showModal()`. The browser top layer places it above transformed or backdrop-filtered panels and makes the rest of the document inert. Cancel is initially focused; Escape cancels; closing restores focus and scroll state. No large z-index is required.

Station Complete is a visual instruction to move to the next device. It does not launch Station 02 or synchronize devices. Those tasks remain paused.
