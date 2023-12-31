/**
 * Returns an object consisting of props beyond the scope of the Component.
 * Useful for getting and spreading unknown props from the user.
 * @param {object} propTypes
 * @param {object} props A ReactElement props object
 * @returns {{}} A shallow copy of the prop object
 */

// fix unable to get propTypes after gatsby is compiled
const getUnhandledProps = (
  propTypeKeys: string[],
  props: Record<string, any>
) => {
  return Object.keys(props).reduce((acc: any, prop: string) => {
    if (prop === 'childKey') {
      return acc;
    }
    if (propTypeKeys.length > 0 && propTypeKeys.indexOf(prop) === -1) {
      acc[prop] = props[prop];
    }

    return acc;
  }, {});
};

export default getUnhandledProps;
