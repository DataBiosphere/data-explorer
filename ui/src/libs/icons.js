/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, { className, ...props } = {}) {
  return h("clr-icon", _.merge({ shape, class: className }, props));
};
