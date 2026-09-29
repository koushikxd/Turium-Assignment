Postmortem: checkout outage on 14 March

Summary. For 47 minutes on the afternoon of 14 March, roughly a third of card payments at checkout failed. Customers saw a generic "payment could not be completed" page, and the payments service logged error PAY-5031 for each failed attempt. No card was charged twice, and no order was lost, but about 1,900 orders were abandoned during the window.

Timeline. At 14:02 a routine deploy of the payments service went out with a new connection pool setting. At 14:09 the error rate alert fired, but it was routed to a channel nobody on call was watching, because the alert had been created before the on-call rotation moved to the new pager tool. At 14:31 a support agent escalated after a spike in customer chats. At 14:40 the on-call engineer rolled the deploy back, and errors stopped by 14:49.

Root cause. The deploy lowered the maximum pool size for connections to the card processor from 50 to 5. The value was meant for the staging environment and was copied into the production config by mistake during a merge. Under afternoon load, requests waited for a free connection, hit the processor's 3-second handshake deadline and failed with PAY-5031, which is our code for "processor connection timed out".

Why it took so long. Detection was slow because of the misrouted alert, not because the alert itself was wrong: it fired seven minutes after the deploy. The rollback itself took nine minutes once someone was looking, most of it spent confirming that the deploy was the cause.

What went well. Idempotency keys worked exactly as designed: retries from customers who clicked pay again never produced a double charge. The support team noticed the pattern in chats within twenty minutes and escalated without being asked.

Action items. First, every alert for the payments service now pages the on-call rotation directly; Priya owns this and it is already done. Second, production and staging pool sizes move into separate files that cannot be merged into each other; Tomás owns this, due end of March. Third, deploys of the payments service now wait for a ten-minute canary at 5 percent of traffic before going wide; this needs a change to the deploy pipeline and is owned by the platform team. Fourth, we will add a dashboard panel that shows pool saturation next to the error rate, so the next time the two move together it is obvious at a glance.
