import * as propParser from "css-property-parser";
import { StringDict } from "@opticss/util";

export function expandPropertyName(prop: string, recursively = false): string[] {
  let props = propParser.getShorthandComputedProperties(prop, recursively);
  if (recursively) {
    return props.filter(p => propParser.isShorthandProperty(p));
  } else {
    return props;
  }
}

export function fullyExpandShorthandProperty(prop: string, value: string) {
  try {
    let expanded = propParser.expandShorthandProperty(prop, value, true);
    for (let p of Object.keys(expanded)) {
      if (propParser.isShorthandProperty(p)) {
        delete expanded[p];
      }
    }
    return expanded;
  } catch (e) {
    if (/parsing shorthand property/.test(e.message)) {
      console.error(e);
      return {
        [prop]: value
      };
    } else {
      throw e;
    }
  }
}

export function expandIfNecessary(authoredProps: Set<string>, prop: string, value: string): StringDict {
  if (!propParser.isShorthandProperty(prop)) {
    return {[prop]: value};
  }
  let longhandDeclarations: StringDict = {};
  let longHandProps;
  let longHandValues;
  try {
    longHandValues = propParser.expandShorthandProperty(prop, value, false, true);
    longHandProps = Object.keys(longHandValues);
  } catch (e) {
    if (/parsing shorthand property/.test(e.message)) {
      console.error(e);
      return { [prop]: value };
    } else {
      throw e;
    }
  }
  let directAuthored = longHandProps.some(p => authoredProps.has(p));
  for (let p of longHandProps) {
    let v = longHandValues[p];
    let expanded = expandIfNecessary(authoredProps, p, v);
    if (Object.keys(expanded).some(key => authoredProps.has(key))) {
      Object.assign(longhandDeclarations, expanded);
    } else if (directAuthored) {
      Object.assign(longhandDeclarations, {[p]: v});
    }
  }
  if (Object.keys(longhandDeclarations).length === 0) {
    longhandDeclarations[prop] = value;
  }
  return longhandDeclarations;
}
