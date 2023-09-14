<div id="top"></div>
<!--
*** This README was created with https://github.com/othneildrew/Best-README-Template
-->



<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">

<h3 align="center">App Lib for javaScript based projects</h3>

  <p align="center">
    Unifies many JSON Schema files into a single file.
    <br />
    <br />
    <a href="https://github.com/lenra-io/json-schema-unifier/issues">Report Bug</a>
    ·
    <a href="https://github.com/lenra-io/json-schema-unifier/issues">Request Feature</a>
  </p>
</div>

<!-- USAGE EXAMPLES -->
## Usage

To unify many JSON Schema files into a single file, create a main JSON Schema file that correspond to the main element to check and has `$ref` to the other ones.

```json
// person.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/person.schema.json",
  "title": "Person",
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "description": "The person's first name."
    },
    "lastName": {
      "type": "string",
      "description": "The person's last name."
    },
    "age": {
      "description": "Age in years which must be equal to or greater than zero.",
      "type": "integer",
      "minimum": 0
    },
    "address": {
      "$ref": "address.schema.json"
    }
  }
}
```

Create the referenced files:

```json
// address.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/address.schema.json",
  "title": "Address",
  "type": "object",
  "properties": {
    "streetAddress": {
      "type": "string"
    },
    "city": {
      "type": "string"
    },
    "state": {
      "type": "string"
    },
    "country": {
      "type": "string"
    }
  },
  "required": ["streetAddress", "city", "state", "country"]
}
```

The references are resolved recursively and the result is a single file with all the definitions.

```json
// unified.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/person.schema.json",
  "title": "Person",
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "description": "The person's first name."
    },
    "lastName": {
      "type": "string",
      "description": "The person's last name."
    },
    "age": {
      "description": "Age in years which must be equal to or greater than zero.",
      "type": "integer",
      "minimum": 0
    },
    "address": {
      "$ref": "#/definitions/address"
    }
  },
  "definitions": {
    "address": {
      "title": "Address",
      "type": "object",
      "properties": {
        "streetAddress": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "state": {
          "type": "string"
        },
        "country": {
          "type": "string"
        }
      },
      "required": ["streetAddress", "city", "state", "country"]
    }
  }
}
```

### as a CLI

To use the CLI, install the package globally:

```bash
npm install -g @lenra/json-schema-unifier
```

Then run the command:

```bash
json-schema-unifier person.schema.json
```

By default, the output is printed to the console. To save it to a file, use the `--output` option:

```bash
json-schema-unifier person.schema.json --output unified.schema.json
```

You also can specify the output format with the `--format` option. The available formats are `json` and `yaml`:

```bash
json-schema-unifier person.schema.json --format yaml
```

A `--verbose` option is also available to print the logs to the console.

### as a Library

To use the library, install it as a dependency:

```bash
npm install @lenra/json-schema-unifier
```

Then import it in your code:

```js
import { JsonSchemaUnifier } from '@lenra/json-schema-unifier';

const result = JsonSchemaUnifier.unify('person.schema.json');
```

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please open an issue with the tag "enhancement".
Don't forget to give the project a star if you liked it! Thanks again!

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the **MIT** License. See [LICENSE](./LICENSE) for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Lenra - [@lenra_dev](https://twitter.com/lenra_dev) - contact@lenra.io

Project Link: [https://github.com/lenra-io/json-schema-unifier](https://github.com/lenra-io/json-schema-unifier)

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/lenra-io/json-schema-unifier.svg?style=for-the-badge
[contributors-url]: https://github.com/lenra-io/json-schema-unifier/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lenra-io/json-schema-unifier.svg?style=for-the-badge
[forks-url]: https://github.com/lenra-io/json-schema-unifier/network/members
[stars-shield]: https://img.shields.io/github/stars/lenra-io/json-schema-unifier.svg?style=for-the-badge
[stars-url]: https://github.com/lenra-io/json-schema-unifier/stargazers
[issues-shield]: https://img.shields.io/github/issues/lenra-io/json-schema-unifier.svg?style=for-the-badge
[issues-url]: https://github.com/lenra-io/json-schema-unifier/issues
[license-shield]: https://img.shields.io/github/license/lenra-io/json-schema-unifier.svg?style=for-the-badge
[license-url]: https://github.com/lenra-io/json-schema-unifier/blob/master/LICENSE
