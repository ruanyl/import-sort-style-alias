import * as findRoot from "find-root";
import {extname} from "path";
import {readFileSync} from "fs";
import {IImport} from "import-sort-parser";
import {IStyleAPI, IStyleItem} from "import-sort-style";

const isAlias = (alias: string) => (imported: IImport) => imported.moduleName.indexOf(alias) === 0;

const hasAlias = (alias: any) => (imported: IImport) => {
  return alias.some((a: string) => imported.moduleName.indexOf(a) === 0);
};

const createAliasRules = (styleApi: IStyleAPI, alias: string[]): IStyleItem[] => {
  console.log(alias);
  const {
    and,
    hasDefaultMember,
    hasNamedMembers,
    hasNamespaceMember,
    hasNoMember,
    hasOnlyDefaultMember,
    hasOnlyNamedMembers,
    hasOnlyNamespaceMember,
    isAbsoluteModule,
    isRelativeModule,
    member,
    name,
    not,
    startsWithAlphanumeric,
    startsWithLowerCase,
    startsWithUpperCase,
    unicode,
  } = styleApi;

  return alias.reduce((accumulator: IStyleItem[], currentValue: string) => {
    return accumulator.concat([
      // import * as _ from "alias/name";
      {match: and(hasOnlyNamespaceMember, isAbsoluteModule, isAlias(currentValue), not(member(startsWithAlphanumeric))), sort: member(unicode)},
      // import * as Foo from "bar";
      {match: and(hasOnlyNamespaceMember, isAbsoluteModule, isAlias(currentValue), member(startsWithUpperCase)), sort: member(unicode)},
      // import * as foo from "bar";
      {match: and(hasOnlyNamespaceMember, isAbsoluteModule, isAlias(currentValue), member(startsWithLowerCase)), sort: member(unicode)},

      // import _, * as bar from "baz";
      {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, isAlias(currentValue), not(member(startsWithAlphanumeric))), sort: member(unicode)},
      // import Foo, * as bar from "baz";
      {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, isAlias(currentValue), member(startsWithUpperCase)), sort: member(unicode)},
      // import foo, * as bar from "baz";
      {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, isAlias(currentValue), member(startsWithUpperCase)), sort: member(unicode)},

      // import _ from "bar";
      {match: and(hasOnlyDefaultMember, isAbsoluteModule, isAlias(currentValue), not(member(startsWithAlphanumeric))), sort: member(unicode)},
      // import Foo from "bar";
      {match: and(hasOnlyDefaultMember, isAbsoluteModule, isAlias(currentValue), member(startsWithUpperCase)), sort: member(unicode)},
      // import foo from "bar";
      {match: and(hasOnlyDefaultMember, isAbsoluteModule, isAlias(currentValue), member(startsWithLowerCase)), sort: member(unicode)},

      // import _, {bar, …} from "baz";
      {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, isAlias(currentValue), not(member(startsWithAlphanumeric))), sort: member(unicode), sortNamedMembers: name(unicode)},
      // import Foo, {bar, …} from "baz";
      {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, isAlias(currentValue), member(startsWithUpperCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
      // import foo, {bar, …} from "baz";
      {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, isAlias(currentValue), member(startsWithLowerCase)), sort: member(unicode), sortNamedMembers: name(unicode)},

      // import {_, bar, …} from "baz";
      {match: and(hasOnlyNamedMembers, isAbsoluteModule, isAlias(currentValue), not(member(startsWithAlphanumeric))), sort: member(unicode), sortNamedMembers: name(unicode)},
      // import {Foo, bar, …} from "baz";
      {match: and(hasOnlyNamedMembers, isAbsoluteModule, isAlias(currentValue), member(startsWithUpperCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
      // import {foo, bar, …} from "baz";
      {match: and(hasOnlyNamedMembers, isAbsoluteModule, isAlias(currentValue), member(startsWithLowerCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
    ]);
  }, []);
};

const getAlias = (extension: string, config: any) => {
  let alias: string[] = [];
  Object.keys(config).forEach((key: string) => {
    if (key.indexOf(extension) >= 0) {
      alias = config[key].custom && config[key].custom.alias;
    }
  });
  return alias || [];
};

export default function(styleApi: IStyleAPI, file?: string): Array<IStyleItem> {
  const {
    and,
    hasDefaultMember,
    hasNamedMembers,
    hasNamespaceMember,
    hasNoMember,
    hasOnlyDefaultMember,
    hasOnlyNamedMembers,
    hasOnlyNamespaceMember,
    isAbsoluteModule,
    isRelativeModule,
    member,
    name,
    not,
    startsWithAlphanumeric,
    startsWithLowerCase,
    startsWithUpperCase,
    unicode,
  } = styleApi;

  const importSortConfig = JSON.parse(readFileSync(`${findRoot(file)}/package.json`, "utf-8")).importSort;
  const alias = getAlias(extname(file!), importSortConfig);
  console.log(alias);
  const customRules: IStyleItem[] = createAliasRules(styleApi, alias);
  console.log(customRules);

  return [
    // import "foo"
    {match: and(hasNoMember, isAbsoluteModule)},
    {separator: true},

    // import "./foo"
    {match: and(hasNoMember, isRelativeModule)},
    {separator: true},

    // import * as _ from "bar";
    {
      match: and(hasOnlyNamespaceMember, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))),
      sort: member(unicode),
    },
    // import * as Foo from "bar";
    {
      match: and(hasOnlyNamespaceMember, isAbsoluteModule, not(hasAlias(alias)), member(startsWithUpperCase)),
      sort: member(unicode),
    },
    // import * as foo from "bar";
    {
      match: and(hasOnlyNamespaceMember, isAbsoluteModule, not(hasAlias(alias)), member(startsWithLowerCase)),
      sort: member(unicode),
    },

    // import _, * as bar from "baz";
    {
      match: and(
        hasDefaultMember,
        hasNamespaceMember,
        isAbsoluteModule,
        not(hasAlias(alias)),
        not(member(startsWithAlphanumeric)),
      ),
      sort: member(unicode),
    },
    // import Foo, * as bar from "baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, not(hasAlias(alias)), member(startsWithUpperCase)), sort: member(unicode)},
    // import foo, * as bar from "baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, not(hasAlias(alias)), member(startsWithUpperCase)), sort: member(unicode)},

    // import _ from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))), sort: member(unicode)},
    // import Foo from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, not(hasAlias(alias)), member(startsWithUpperCase)), sort: member(unicode)},
    // import foo from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, not(hasAlias(alias)), member(startsWithLowerCase)), sort: member(unicode)},

    // import _, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import Foo, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, not(hasAlias(alias)), member(startsWithUpperCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import foo, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, not(hasAlias(alias)), member(startsWithLowerCase)), sort: member(unicode), sortNamedMembers: name(unicode)},

    // import {_, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import {Foo, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, not(hasAlias(alias)), member(startsWithUpperCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import {foo, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, not(hasAlias(alias)), member(startsWithLowerCase)), sort: member(unicode), sortNamedMembers: name(unicode)},

    {separator: true},

    ...customRules,

    {separator: true},

    // import * as _ from "./bar";
    {match: and(hasOnlyNamespaceMember, isRelativeModule, not(member(startsWithAlphanumeric))), sort: member(unicode)},
    // import * as Foo from "./bar";
    {match: and(hasOnlyNamespaceMember, isRelativeModule, member(startsWithUpperCase)), sort: member(unicode)},
    // import * as foo from "./bar";
    {match: and(hasOnlyNamespaceMember, isRelativeModule, member(startsWithLowerCase)), sort: member(unicode)},

    // import _, * as bar from "./baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isRelativeModule, not(member(startsWithAlphanumeric))), sort: member(unicode)},
    // import Foo, * as bar from "./baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isRelativeModule, member(startsWithUpperCase)), sort: member(unicode)},
    // import foo, * as bar from "./baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isRelativeModule, member(startsWithUpperCase)), sort: member(unicode)},

    // import _ from "./bar";
    {match: and(hasOnlyDefaultMember, isRelativeModule, not(member(startsWithAlphanumeric))), sort: member(unicode)},
    // import Foo from "./bar";
    {match: and(hasOnlyDefaultMember, isRelativeModule, member(startsWithUpperCase)), sort: member(unicode)},
    // import foo from "./bar";
    {match: and(hasOnlyDefaultMember, isRelativeModule, member(startsWithLowerCase)), sort: member(unicode)},

    // import _, {bar, …} from "./baz";
    {match: and(hasDefaultMember, hasNamedMembers, isRelativeModule, not(member(startsWithAlphanumeric))), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import Foo, {bar, …} from "./baz";
    {match: and(hasDefaultMember, hasNamedMembers, isRelativeModule, member(startsWithUpperCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import foo, {bar, …} from "./baz";
    {match: and(hasDefaultMember, hasNamedMembers, isRelativeModule, member(startsWithLowerCase)), sort: member(unicode), sortNamedMembers: name(unicode)},

    // import {_, bar, …} from "./baz";
    {match: and(hasOnlyNamedMembers, isRelativeModule, not(member(startsWithAlphanumeric))), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import {Foo, bar, …} from "./baz";
    {match: and(hasOnlyNamedMembers, isRelativeModule, member(startsWithUpperCase)), sort: member(unicode), sortNamedMembers: name(unicode)},
    // import {foo, bar, …} from "./baz";
    {match: and(hasOnlyNamedMembers, isRelativeModule, member(startsWithLowerCase)), sort: member(unicode), sortNamedMembers: name(unicode)},

    {separator: true},
  ];
}
