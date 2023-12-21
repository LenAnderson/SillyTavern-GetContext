# /context

/context gives you access to SillyTavern's application context.

Open your browser's dev tools (F12) and type the following to see what data is available.

    SillyTavern.getContext()




## Accessing Values

Use `::` to access child values (items in a list or dictionary).

Example: `/context characters::10::first_mes`




## Filtering Lists

Lists an be filtered and searched with several functions:
- `find` - Find one list item by comparing one of its properties against a provided value.
- `findIndex` - Find one list item's index (position in the list) by comparing one of its properties against a provided value.
- `filter` - Get a list with all matching item's by comparing one of the item's properties against a provided value.

They are all used the same way:

```
/context characters(find name eq Seraphina) | /echo
/context characters(findIndex name eq Code Sensei) | /echo
/context characters(filter fav eq true) | /echo
```

Comparison operations for the find and filter functions are as follows:
- `eq` – property equals value
- `neq` – property does not equal value
- `lt` – property is less than value
- `lte` – property is less than or equals value
- `gt` – property is greater than value
- `gte` – property is greater than or equals value
- `in` – property is included in value (character in text or item in list)
- `nin` – property is not included in value




## Map

To extract only one property of a dictionary or object you can use map.

`/context characters(map name) | /echo`

Can be combined with filters.

`/context characters(filter fav eq true)(map name)`




## Examples
```
/context chatId | /echo
– gets the ID of he active chat
```
```
/context characters::5::avatar | /echo
– gets the avatar filename of the character at index 5 (index starts at 0)
```
```
/context characters(find name eq Alice)::avatar | /echo
– gets the avatar filename of the character named Alice
```
```
/context groupId | /context groups(find id eq {{pipe}})::members | /echo
– gets the list of members of the current group (their avatar filenames)
```
```
/context groupId | /context groups(find id eq {{pipe}})::members::1 | /context characters(find avatar eq {{pipe}})::name |/echo
– gets the name of the second member of the current group (index starts at 0)
```
