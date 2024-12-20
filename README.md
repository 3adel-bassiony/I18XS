# i18XS

![npm](https://img.shields.io/npm/v/i18xs)
![npm bundle size](https://img.shields.io/bundlephobia/min/i18xs)
![npm package minimized gzipped size (select exports)](https://img.shields.io/bundlejs/size/i18xs)
![gh-workflow-image](https://img.shields.io/github/actions/workflow/status/3adel-bassiony/i18xs/main.yml)
![NPM](https://img.shields.io/npm/l/i18xs)

Discover I18XS, a remarkably efficient 3kb i18n solution for JavaScript and Node.js, ideal for developers prioritizing performance and simplicity. Written in TypeScript, it offers seamless integration for both TypeScript and JavaScript projects. Its compact size belies its powerful functionality, making it perfect for lightweight, modern applications. With ESM compatibility, I18XS aligns with contemporary development practices, ensuring its utility in a range of projects from small-scale to complex.

&nbsp;

## Quick Navigation

1. [Installation](#installation)
2. [Usage](#usage)
3. [Documentation](#documentation)
4. [Support and Questions](#installation)
5. [Contribution](#contribution)
6. [Guidelines for Contributions](#guidelines-for-contributions)
7. [License](#license)

&nbsp;

# Installation

Getting up and running with I18XS is a breeze. Choose your preferred package manager from the options below and follow the simple installation steps:

#### NPM

```bash
npm i i18xs
```

#### Bun

```bash
bun i i18xs
```

#### Yarn

```bash
yarn add i18xs
```

#### Pnpm

```bash
pnpm install i18xs
```

&nbsp;

# Supported Environments

I18XS is compatible with the following environments:

- **Node.js**: Use with ESM-enabled projects for server-side applications, CLI tools, or APIs.
- **Bun**: Fully optimized for modern, fast runtimes like Bun.
- **React Native**: Ideal for mobile applications, allowing direct localization without relying on file systems.
- **Browser**: Easily integrate with client-side applications built with frameworks like React, Vue.js, or plain JavaScript.
- **Other JavaScript Environments**: Works in any runtime that supports ESM (ECMAScript Modules).

&nbsp;

# Usage

Once you have installed I18XS, integrating it into your project is straightforward. Below are the basic steps to get you started:

First, import I18XS into your JavaScript or TypeScript file:

```typescript
import I18XS from 'i18xs'
```

Then create a new instance for i18xs and pass the configuration to it:

```typescript
const i18xs = new I18XS({
	supportedLocales: ['en'],
	currentLocale: 'en',
	fallbackLocale: 'en',
	rtlLocales: ['ar'],
})
```

And then you can use it like this:

```typescript
const localizedMessage = i18xs.t('common.Hello_World') // -> Hello World
```

&nbsp;

# Documentation

The I18XS package comes with a comprehensive set of features designed to make internationalization in your application straightforward and efficient. This section provides an overview of its capabilities and guides on how to use them effectively.

-   ### Features Overview

    -   **Simple Locale Management**: Easily switch between languages in your application.
    -   **Dynamic Content Loading**: Load language resources as needed, without bloating your application.
    -   **Pluralization and Formatting**: Advanced support for plural forms and number formatting.
    -   **Customization and Extensibility**: Extend or customize functionalities to fit your application’s needs.
    -   **LTR & RTL Detection**: Detect LTR & RTL for easy access and usage

-   ### Loading Localization

    In multi-language applications, managing localization files is crucial. I18XS simplifies this process. Follow these guidelines to set up and utilize localization files effectively or you can just load all localizations at once:

    -   #### Multiple Files Structure

        Organize your localization files in a structured manner for each supported language. Create a folder for each language in the `locales` directory, naming them with the locale identifier (e.g., `en` for English, `ar` for Arabic). Each folder should contain JSON files with key-value pairs for localized strings.

        Example structure for the locales folder:

        ```
        /locales
            ├── /en
            │    ├── common.json
            │    ├── validation.json
            │    └── more JSON files...
            │
            ├── /fr
            │    ├── common.json
            │    ├── validation.json
            │    └── more JSON files...
            │
            └── /ar
                 ├── common.json
                 ├── validation.json
                 └── more JSON files...
        ```

        Example structure for `common.json`:

        ```json
        {
        	"Hello_World": "Hello World",
        	"Welcome_Message": "Welcome {name}",
        	"Items_Count": {
        		"zero": "No items",
        		"one": "One item",
        		"two": "Two items",
        		"other": "{itemsCount} items"
        	}
        }
        ```

    - #### Pass All Localizations Directly
        For applications that do not support loading localization files (e.g., React Native), you can pass localization data directly to the I18XS instance. This method eliminates the need to read JSON files at runtime.

        ```typescript
        const i18xs = new I18XS({
            currentLocale: 'en',
            supportedLocales: ['en', 'ar'],
            localizations: {
                en: {
                    general: {
                        Hello_World: 'Hello World',
                    },
                },
                ar: {
                    general: {
                        Hello_World: 'مرحبًا بالعالم',
                    },
                },
            },
        })
        ```

    - #### Performance and Usage

        -   **Efficient Loading:** I18XS optimizes performance by loading only the current locale's JSON file. This approach ensures faster load times and reduces memory usage.
        -   **Multiple Files per Locale:** Each locale is represented by a folder and inside it multiple JSON files. This structure facilitates easier management and collaboration, also significantly enhancing performance and making it read faster.
        -   **Nested Objects Support:** The library supports nested objects, allowing you to logically group related localizations for better organization.
        -   **Pluralization:** I18XS handles plural localization, allowing different translations based on quantity (e.g., zero, one, two, other).

    -   #### Integration

        -   **Single Language Setup:** If your application only uses one language, you can create a single JSON file called `common.json` and use it directly.
        -   **Multiple Languages:** For applications supporting multiple languages, store the localization files in the locales directory. Configure I18XS with the directory path, and it will dynamically load the appropriate file based on the current or changed locale.

-   ### Usage & Configuration

    -   #### **Installation**:

        Refer to the [Installation](#installation) section for instructions on how to install I18XS using various package managers.

    -   #### **Initializing the Library:**

        You can create a new instance of I18XS and pass the configuration for it directly like this example below:

        ```typescript
        const i18xs = new I18XS({
        	supportedLocales: ['en'],
        	currentLocale: 'en',
        	fallbackLocale: 'en',
        	showMissingIdentifierMessage: false,
        	missingIdentifierMessage: 'Missing_Localization_Identifier',
        	rtlLocales: ['ar'],
        	localesDir: './path/to/locales/folder',
        	showLogs: true,
        })
        ```

        Alternatively, you can split the creation of the new instance and the configuration, useful when split up into different modules for bootstrapping.

        ```typescript
        const i18xs = new I18XS()

        i18xs.configure({
        	supportedLocales: ['en'],
        	currentLocale: 'en',
        	fallbackLocale: 'en',
        	showMissingIdentifierMessage: false,
        	missingIdentifierMessage: 'Missing_Localization_Identifier',
        	rtlLocales: ['ar'],
        	localesDir: './path/to/locales/folder',
        	showLogs: true,
        })
        ```

-   ### Methods/Properties

    -   **Localize a message**: You can localize a message by using one of those methods, the localization methods takes an identifier that contains the file name and the key you want to localize, for example, if the file name `common.json` and the message is `Hello_World` you can use it like this:

        ```typescript
        i18xs.t('common.Hello_World') // -> Hello World
        i18xs.formatMessage('common.Hello_World') // -> Hello World
        ```

    -   **Localize a message in nested objects**: You can localize a message using one of those methods

        ```typescript
        i18xs.t('common.Foo.Bar.Hello_World') // -> Hello World
        ```

    -   **changeCurrentLocale**: Use this method to change the current locale of I18XS

        ```typescript
        i18xs.changeCurrentLocale('es') // -> Update the current locale
        ```

    -   **isCurrentLocale**: Use this method to check if the current locale is what you looking for or not.

        ```typescript
        i18xs.isCurrentLocale('es') // -> Update the current locale
        ```

    -   **hasIdentifier** Check if a specific identifier exists in the localization object or not

        ```typescript
        i18xs.hasIdentifier('Hello_World') // -> True || False
        ```

    -   **replaceData** Replace the variables in the data object with the variables placeholder in the message

        ```typescript
        i18xs.replaceData('Welcome {name}', { name: 'John Doe' }) // -> 'Welcome John Doe'
        ```

    -   **searchForLocalization** Search for a localization with identifier and it will return a string message or the plural object for localization

        ```typescript
        i18xs.searchForLocalization('common.Hello_World') // -> 'Hello World'
        i18xs.searchForLocalization('common.Items_Count') // -> {"zero": "No items", "one": "One item", "two": "Two items", "other": "{itemsCount} items" }
        ```

    -   **supportedLocales**: Get the supported locale for the I18XS instance

        ```typescript
        i18xs.supportedLocales // -> ['en', 'ar']
        ```

    -   **currentLocale**: Understand how to change locales dynamically.

        ```typescript
        i18xs.currentLocale // -> 'en'
        ```

    -   **fallbackLocale**: Get the fallback locale to use it in case the current locale file is not found

        ```typescript
        i18xs.fallbackLocale // -> 'en'
        ```

    -   **localization** Get the localization object

        ```typescript
        i18xs.fallbackLocale // -> 'en'
        ```

    -   **isCurrentLocaleLTR**: Check if the current locale is Left-To-Right (LTR) or not

        ```typescript
        i18xs.isCurrentLocaleLTR // -> True || False
        ```

    -   **isCurrentLocaleRTL**: Check if the current locale is Right-To-Left (RTL) or not

        ```typescript
        i18xs.isCurrentLocaleLTR // -> True || False
        ```

    -   **isShowLogs**: Check if the debug mode is enabled or not

        ```typescript
        i18xs.isShowLogs // -> True || False
        ```

&nbsp;

# Support and Questions

If you have any questions or need support while using I18XS, feel free to open an issue on our [GitHub repository](https://github.com/3adel-bassiony/I18XS/issues) or reach out to the community for help.

For the complete and detailed guide, please refer to our [official documentation](#documentation).

&nbsp;

# Contribution

First off, thank you for considering contributing to I18XS! It's people like you who make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

There are many ways you can contribute to I18XS, even if you're not a technical person:

-   **Submit Bug Reports:** If you find a bug, please open an issue. Remember to include a clear description and as much relevant information as possible.
-   **Feature Suggestions:** Have an idea for a new feature or an improvement? Open an issue and tag it as a feature request.
-   **Code Contributions:** Interested in adding a feature or fixing a bug? Awesome! Please open a pull request with your changes.
-   **Documentation:** Good documentation is key to any project. If you see something unclear or missing, feel free to submit a pull request.
-   **Spread the Word:** Share I18XS with your network and let others know about it.

&nbsp;

# Guidelines for Contributions

Ensure you use a consistent coding style with the rest of the project.
Write clear, readable, and concise code.
Add unit tests for new features to ensure reliability and maintainability.
Update the README or documentation with details of changes, this includes new environment variables, exposed ports, useful file locations, and container parameters.
Increase the version numbers in any example files and the README to the new version that this Pull Request would represent.

&nbsp;

# License

I18XS is licensed under the MIT License. This license permits use, modification, and distribution, free of charge, for both private and commercial purposes. It also offers a good balance between protecting the author's rights and allowing for flexibility and freedom in the use of the software.
