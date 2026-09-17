# Report contract (current)
Version 2 input is `{ title, sections: [{ name, values }] }`. Return `{ title, lines }`; render sections in INPUT ORDER as `name: sum(values)`. Empty `values` sums to 0. Version 1 input `{ title, values }` remains supported as one `summary` line. Do not use archived sorting behavior.
