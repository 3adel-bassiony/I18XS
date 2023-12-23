# Getting Started

Getting up and running with I18T is a breeze. Choose your preferred package manager from the options below and follow the simple installation steps:

#### NPM

```bash
npm i i18trans
```

#### Bun

```bash
bun i i18trans
```

#### Yarn

```bash
yarn add i18trans
```

#### Pnpm

```bash
pnpm install i18trans
```

# Usage

Once you have installed I18T, integrating it into your project is straightforward. Below are the basic steps to get you started:

First, import I18T into your JavaScript or TypeScript file:

```javascript
import I18T from 'i18t'
```

Then create a new instance for i18t and pass the configuration to it:

```javascript
const i18t = new I18T({
	defaultLocale: 'en',
	fallbackLocale: 'en',
	translations: {
		Hello_World: 'Hello World',
		// ... more key-value pairs
	},
})
```

And then you can use it like this:

```javascript
const localizedMessage = i18t.t('Hello_World') // -> Hello World
```

# Documentation

The I18T package comes with a comprehensive set of features designed to make internationalization in your application straightforward and efficient. This section provides an overview of its capabilities and guides on how to use them effectively.

-   ### Features Overview

    -   **Simple Locale Management**: Easily switch between languages in your application.
    -   **Dynamic Content Loading**: Load language resources as needed, without bloating your application.
    -   **Pluralization and Formatting**: Advanced support for plural forms and number formatting.
    -   **Customization and Extensibility**: Extend or customize functionalities to fit your application’s needs.
    -   **LTR & RTL Detection**: Detect LTR & RTL for easy access and usage

-   ### Usage & Configuration

    -   **Installation**: Refer to the [Getting Started](#getting-started) section for instructions on how to install I18T using various package managers.

    -   **Initializing the Library:** Learn how to set up I18T in your project.

        ```javascript
        const i18t = new I18T({
        	defaultLocale: 'en',
        	fallbackLocale: 'en',
        	translations: {
        		Hello_World: 'Hello World',
        		// ... more key-value pairs
        	},
        })
        ```

-   ### Methods/Properties

    -   **Localize a message**: You can localize a message using one of those methods

        ```javascript
        i18t.t('Hello_World') // -> Hello World
        i18t.formatMessage('Hello_World') // -> Hello World
        ```

    -   **Localize a message in nested objects**: You can localize a message using one of those methods

        ```javascript
        i18t.t('Common.Foo.Bar.Hello_World') // -> Hello World
        ```

    -   **Get Default Locale**: Understand how to change locales dynamically.

        ```javascript
        i18t.defaultLocale // -> 'en'
        ```

    -   **Get Current Locale**: Understand how to change locales dynamically.

        ```javascript
        i18t.currentLocale // -> 'en'
        ```

    -   **Get Current Locale**: Understand how to change locales dynamically.

        ```javascript
        i18t.supportedLocales // -> ['en', 'ar']
        ```

    -   **Change Locale**: You can change the current locale for I18T

        ```javascript
        i18t.changeLocale('es') // -> Update the current locale
        ```

    -   **Check If Key Exists:** Understand how to change locales dynamically.

        ```javascript
        i18t.hasKey('Hello_World') // -> True || False
        ```

# Support and Questions

If you have any questions or need support while using I18T, feel free to open an issue on our [GitHub repository](#link-to-repo) or reach out to the community for help.

For the complete and detailed guide, please refer to our [official documentation](#link-to-detailed-docs).

# Contribution

First off, thank you for considering contributing to I18T! It's people like you who make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

There are many ways you can contribute to I18T, even if you're not a technical person:

-   **Submit Bug Reports:** If you find a bug, please open an issue. Remember to include a clear description and as much relevant information as possible.
-   **Feature Suggestions:** Have an idea for a new feature or an improvement? Open an issue and tag it as a feature request.
-   **Code Contributions:** Interested in adding a feature or fixing a bug? Awesome! Please open a pull request with your changes.
-   **Documentation:** Good documentation is key to any project. If you see something unclear or missing, feel free to submit a pull request.
-   **Spread the Word:** Share I18T with your network and let others know about it.

# Guidelines for Contributions

Ensure you use a consistent coding style with the rest of the project.
Write clear, readable, and concise code.
Add unit tests for new features to ensure reliability and maintainability.
Update the README or documentation with details of changes, this includes new environment variables, exposed ports, useful file locations, and container parameters.
Increase the version numbers in any example files and the README to the new version that this Pull Request would represent.

# License

I18T is licensed under the MIT License. This license permits use, modification, and distribution, free of charge, for both private and commercial purposes. It also offers a good balance between protecting the author's rights and allowing for flexibility and freedom in the use of the software.