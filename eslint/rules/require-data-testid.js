/**
 * ESLint rule to enforce data-testid on interactive elements
 *
 * This rule requires data-testid on:
 * - button, a, input, select, textarea elements
 * - Elements with role="button" or role="link"
 *
 * Exceptions can be made with eslint-disable comments.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require data-testid on interactive elements for stable E2E testing',
      category: 'Testing',
      recommended: false,
    },
    messages: {
      missingTestId:
        'Interactive element must have a data-testid attribute. See docs/reference/test_selectors.md',
    },
    schema: [],
  },
  create(context) {
    const INTERACTIVE_ELEMENTS = new Set([
      'button',
      'a',
      'input',
      'select',
      'textarea',
    ]);

    function hasDataTestId(attributes) {
      if (!attributes) return false;
      return attributes.some(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name &&
          attr.name.name === 'data-testid',
      );
    }

    function hasRole(attributes, roleValue) {
      if (!attributes) return false;
      const roleAttr = attributes.find(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name &&
          attr.name.name === 'role',
      );
      if (!roleAttr || !roleAttr.value) return false;
      if (roleAttr.value.type === 'Literal') {
        return roleAttr.value.value === roleValue;
      }
      if (roleAttr.value.type === 'JSXExpressionContainer') {
        // Skip dynamic roles - too complex to analyze
        return false;
      }
      return false;
    }

    function isHiddenInput(attributes) {
      if (!attributes) return false;
      const typeAttr = attributes.find(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name &&
          attr.name.name === 'type',
      );
      return (
        typeAttr &&
        typeAttr.value &&
        typeAttr.value.type === 'Literal' &&
        typeAttr.value.value === 'hidden'
      );
    }

    function checkElement(node) {
      const elementName =
        node.name.type === 'JSXIdentifier' ? node.name.name : null;
      if (!elementName) return;

      const attributes = node.attributes || [];

      // Skip hidden inputs - they're not user-interactive
      if (elementName.toLowerCase() === 'input' && isHiddenInput(attributes)) {
        return;
      }

      // Check for interactive HTML elements
      if (INTERACTIVE_ELEMENTS.has(elementName.toLowerCase())) {
        if (!hasDataTestId(attributes)) {
          context.report({
            node,
            messageId: 'missingTestId',
          });
        }
      }

      // Check for role="button" or role="link"
      if (hasRole(attributes, 'button') || hasRole(attributes, 'link')) {
        if (!hasDataTestId(attributes)) {
          context.report({
            node,
            messageId: 'missingTestId',
          });
        }
      }
    }

    return {
      JSXOpeningElement: checkElement,
    };
  },
};
