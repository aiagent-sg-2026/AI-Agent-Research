# Adapter contract
`adapter.open()` returns a handle with an async iterable `rows` property and an async `close()` method. Each row has `user_id` and `display_name`. `exportRows` returns `{ rows: [{ id, name }] }` and closes the handle once, including when iteration fails.
