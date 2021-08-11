[<< Home](./home.md#readme)
# Code Style
I've changed my code style quite a lot throughout the years and so you'll find a very unique style of code used in JokeAPI.  
In this document I will try to explain it.  
  
Please adhere to this style, if you edit files I have created.  
If you have created a file yourself, you can use your own style.

<br>

## General code style:
This describes the general style of the code.  
  
> ### Always add semicolons
> Yes, JavaScript automatically adds semicolons. But still, I've gotten used to always adding them.  
> If you are inside a file *you* have created, feel free to omit them.
> ```js
> let x = 3;
> 
> x = Math.pow(3, 2);
> 
> console.log(x); // 9
> ```

<br>

> ### Double quotes for strings
> This is pretty controversial, but I always use double quotes (`"`) for simple strings.  
> Using single quotes (`'`) is fine, but only in files *you* have created.
> ```js
> let myString = "something";
> ```

<br>

> ### Brackets on a new line
> This one is pretty simple, put curly brackets on a new line:  
> ```js
> function myFunction()
> {
>     return "something";
> }
> ```

<br>

> ### Module / package and file imports
> Imports in the style of CommonJS (`require()`) should always be at the very top.  
> Module and package imports should come first, followed by an empty line.  
> Then, add file imports, followed by another empty line.  
> Then, if needed, add the settings import.  
> After all of the above, add at least two empty lines to separate the imports and the actual code.  
>   
> Module / package imports should use the object deconstruction syntax, to only import the needed functions, classes or objects.  
> File imports should not have the `.js` file extension. The fact that they use a relative path that starts with `./` or `../` is enough indication.
> 
> <details><summary><b>Example (click to view)</b></summary>
> 
> ```js
> const { resolve, join } = require("path");
> const { allOfType } = require("svcorelib");
> 
> const Endpoint = require("./src/classes/Endpoint");
> const httpServer = require("./src/httpServer");
> 
> const settings = require("./settings");
> ```
> 
> </details>  
>   

<br>

> ### Promise parameter names
> Promise parameter names (resolve and reject) should be called `res` and `rej`.  
> This was introduced to prevent conflicts with the [`path`](https://nodejs.org/api/path.html) module's resolve() function.  
>   
> Note that they should, if possible, be followed by a `return`, to make sure no other code after the Promise execution is run.  
> In the below example, removing the `return`s could execute both the `rej()` *and* the `res()` functions.  
>   
> <details><summary><b>Example (click to view)</b></summary>
> 
> ```js
> const { resolve } = require("path");
> const { readFile } = require("fs");
> 
> function readFilePromise(filePath)
> {
>     return new Promise((res, rej) => {
>         filePath = resolve(filePath);
> 
>         readFile(filePath, (err, data) => {
>             if(err)
>                 return rej(err);
>             
>             return res(data.toString());
>         });
>     });
> }
> ```
> 
> </details>  
>   

<br><br>



## JSDoc Comments:
JSDoc is a style of comments that describe a part of the code, like a function, method, variable or class.  
It's pretty difficult to get used to at first, but it's a great way to comment code, especially for a dynamically typed language like JavaScript.  
[This page can be used to learn about JSDoc.](https://devdocs.io/jsdoc/)  
This is a list of tags that should always be considered when writing a JSDoc comment:
| Tag | Example | Description |
| --- | --- | --- |
| `@prop` | `@prop {string} name` | Describes the type of a property of an object |
| `@param` | `@param {number} amount` | Describes the type of a certain function / method parameter |
| `@returns` | `@returns {boolean}` | Describes the type of the returned value of a function / method |
| `@since` | `@since 2.4.0` | Describes the version at which this feature was *first* added |
| `@version` | `@version 2.4.1 Changed xy` | Describes a certain change to a feature and at which version it was introduced |
| `@throws` | `@throws {TypeError} when xy` | Describes what kind of error could be thrown by a function / method and when |
| `@static` | `@static` | Describes that a [method is static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static) |
| `@private` | `@private` | Describes that a [method is private](https://javascript.info/private-protected-properties-methods) |
| `@deprecated` | `@deprecated Since v2.1.0, use xy` | Describes that a feature was deprecated and should not be used anymore |
| `@author` | `@author Sv443` | Describes who made this feature |
| `@type` | `@type {number}` | Sets the type of the next variable |
| `@typedef` | `@typedef {Object} MyCustomType` | Declares a custom type |

<br>

<details><summary><b>Full example (click to view)</b></summary>

```js
/**
 * @typedef {Object} PersonObj This object describes a person
 * @prop {string} name The person's name
 * @prop {number} age The age of the person
 * @prop {boolean} [isIdiot] Optional - whether this person is an idiot
 */

/**
 * This class describes a person
 * @since 1.0.0
 * @author Sv443
 */
class Person
{
    /**
     * Constructs an instance of the `Person` class
     * @param {PersonObj} person
     */
    constructor(person)
    {
        this.name = person.name;
        this.age = person.age;

        this._setIdiocy(person);
    }

    /**
     * Private method - sets the idiocy status based on a passed person object
     * @private
     * @param {PersonObj} person
     * @since 1.0.0
     * @version 1.1.0 The default value was not set correctly, this has now been fixed
     */
    _setIdiocy(person)
    {
        this.isIdiot = person.isIdiot || null; // property is optional, so default to null
    }

    /**
     * Returns the name of a passed person
     * @static
     * @param {Person} someone
     * @returns {string} Returns the name of the passed Person
     * @throws TypeError if the parameter `someone` is not an instance of the class `Person`
     * @since 1.1.0
     */
    static getName(someone)
    {
        if(someone instanceof Person)
            return someone.name;
        else
            throw new TypeError("The passed parameter \"someone\" is not an instance of the class \"Person\"");
    }

    /**
     * @deprecated This method was replaced by the static method `Person.getName()`, so it shouldn't be used anymore
     * @since 1.0.0
     * @version 1.1.0 Deprecated method
     */
    getMyName()
    {
        return this.name;
    }
}




/** @type {PersonObj} */
let svenObj = {
    name: "Sven",
    age: 19,
    isIdiot: true
};

let sven = new Person(svenObj);

console.log(Person.getName(sven)); // "Sven"
```

</details>



<br><br>



### Import Types:
If you want to import types that are declared in a package or a local file, you can use import():  

> File: `types.js`
> ```js
> /**
>  * @typedef {object} MyCustomType
>  * @prop {string} foo
>  * @prop {number} bar
>  */
> ```
  
> File: `index.js`
> ```js
> /**
>  * @param {import("./types.js").MyCustomType} paramFoo Object with `foo` and `bar` props
>  * @param {import("http").Server} paramBar A HTTP server instance
>  */
> function doSomething(paramFoo, paramBar)
> {
> 
> }
> ```


<br><br>



## ES6 Classes:
Use ES6 classes as much as possible.  
Object oriented programming (OOP) is pretty cool, especially when you need multiple objects that have the same base functionality.  
  
From versions 2.0.0 until 2.4.0 I spent a long time refactoring a lot of the code to use classes and inheritance.  
This makes implementing new features easier and makes fixing bugs a LOT easier.  
  
The basic style of ES6 classes is as follows:
- Use PascalCase for the class names (for example: `MyCoolClassThatDoesThings`)
- Use camelCase for the method names (for example: `thisIsAMethod()`)
- Make use of static methods if no reference to `this` is needed ([what are static methods?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static))
- Put classes in their own file, named just like the class name (for example: class name = `MyClass`, so file name = "MyClass.js")  
  
<details><summary><b>Example (click to view)</b></summary>

```js
/**
 * This is my class
 */
class MyClass
{
    /**
     * Constructs an instance of the class `MyClass`
     * @param {string} foo Some parameter, idk
     */
    constructor(foo)
    {
        this.foo = foo;
    }

    /**
     * Returns the property "foo", as uppercase
     * @returns {string}
     */
    getFoo()
    {
        return MyClass.uppercase(this.foo); // static methods can't be called on `this`
    }

    /**
     * Converts a string to uppercase
     * @static
     * @param {string} str
     * @returns {string}
     */
    static uppercase(str)
    {
        return str.toUpperCase();
    }
}

module.exports = MyClass; // since classes are in their own files, export the class so it can be imported in other files





// *** example usage ***

let x = new MyClass("example"); // create an instance of the class using the `new` keyword

console.log(x.foo);      // "example"
console.log(x.getFoo()); // "EXAMPLE"

// using the static method, outside of the class:
console.log(MyClass.uppercase("something")); // "SOMETHING"
```

</details>


<br><br><br><br>

[<< Home](./home.md#readme)
