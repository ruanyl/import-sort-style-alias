import {extname} from "path";
import {readFileSync} from "fs";
import {IImport} from "import-sort-parser";
import {IStyleAPI, IStyleItem} from "import-sort-style";

const isAlias = (alias: string[]) => (moduleName: string) => alias.indexOf(moduleName.split("/")[0]) >= 0;

const hasAlias = (alias: any) => (imported: IImport) => {
  return alias.some((a: string) => imported.moduleName.indexOf(a) === 0);
};

const customSort = (comparator) =>
  (first: string, second: string) =>
  comparator(first.toLowerCase(), second.toLowerCase());

export default function(styleApi: IStyleAPI, file?: string, options?: any): IStyleItem[] {
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
    moduleName,
  } = styleApi;

  const alias = options.alias || [];

  let sortBy;
  switch (options.sortBy) {
    case "moduleName":
      sortBy = moduleName;
      break;
    case "member":
      sortBy = member;
      break;
    default:
      sortBy = moduleName;
      break;
  }

  const comparator = options.ignoreCase === false ? unicode : customSort(unicode);

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
      sort: sortBy(comparator),
    },
    // import * as Foo from "bar";
    // import * as foo from "bar";
    {
      match: and(hasOnlyNamespaceMember, isAbsoluteModule, not(hasAlias(alias))),
      sort: sortBy(comparator),
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
      sort: sortBy(comparator),
    },
    // import Foo, * as bar from "baz";
    // import foo, * as bar from "baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, not(hasAlias(alias))), sort: sortBy(comparator)},

    // import _ from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import Foo from "bar";
    // import foo from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, not(hasAlias(alias))), sort: sortBy(comparator)},

    // import _, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},
    // import Foo, {bar, …} from "baz";
    // import foo, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, not(hasAlias(alias))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},

    // import {_, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, not(hasAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},
    // import {Foo, bar, …} from "baz";
    // import {foo, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, not(hasAlias(alias))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},

    {separator: true},

    // import * as _ from "./bar";
    {match: and(hasOnlyNamespaceMember, isRelativeModule, not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import * as Foo from "./bar";
    // import * as foo from "./bar";
    {match: and(hasOnlyNamespaceMember, isRelativeModule), sort: sortBy(comparator)},

    // import _, * as bar from "./baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isRelativeModule, not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import Foo, * as bar from "./baz";
    // import foo, * as bar from "./baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isRelativeModule), sort: sortBy(comparator)},

    // import _ from "./bar";
    {match: and(hasOnlyDefaultMember, isRelativeModule, not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import Foo from "./bar";
    // import foo from "./bar";
    {match: and(hasOnlyDefaultMember, isRelativeModule), sort: sortBy(comparator)},

    // import _, {bar, …} from "./baz";
    {match: and(hasDefaultMember, hasNamedMembers, isRelativeModule, not(member(startsWithAlphanumeric))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},
    // import Foo, {bar, …} from "./baz";
    // import foo, {bar, …} from "./baz";
    {match: and(hasDefaultMember, hasNamedMembers, isRelativeModule), sort: sortBy(comparator), sortNamedMembers: name(comparator)},

    // import {_, bar, …} from "./baz";
    {match: and(hasOnlyNamedMembers, isRelativeModule, not(member(startsWithAlphanumeric))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},
    // import {Foo, bar, …} from "./baz";
    // import {foo, bar, …} from "./baz";
    {match: and(hasOnlyNamedMembers, isRelativeModule), sort: sortBy(comparator), sortNamedMembers: name(comparator)},

    {separator: true},

    // import * as _ from "alias/name";
    {match: and(hasOnlyNamespaceMember, isAbsoluteModule, moduleName(isAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import * as Foo from "bar";
    // import * as foo from "bar";
    {match: and(hasOnlyNamespaceMember, isAbsoluteModule, moduleName(isAlias(alias))), sort: sortBy(comparator)},

    // import _, * as bar from "baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, moduleName(isAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import Foo, * as bar from "baz";
    // import foo, * as bar from "baz";
    {match: and(hasDefaultMember, hasNamespaceMember, isAbsoluteModule, moduleName(isAlias(alias))), sort: sortBy(comparator)},

    // import _ from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, moduleName(isAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator)},
    // import Foo from "bar";
    // import foo from "bar";
    {match: and(hasOnlyDefaultMember, isAbsoluteModule, moduleName(isAlias(alias))), sort: sortBy(comparator)},

    // import _, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, moduleName(isAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},
    // import Foo, {bar, …} from "baz";
    // import foo, {bar, …} from "baz";
    {match: and(hasDefaultMember, hasNamedMembers, isAbsoluteModule, moduleName(isAlias(alias))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},

    // import {_, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, moduleName(isAlias(alias)), not(member(startsWithAlphanumeric))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},
    // import {Foo, bar, …} from "baz";
    // import {foo, bar, …} from "baz";
    {match: and(hasOnlyNamedMembers, isAbsoluteModule, moduleName(isAlias(alias))), sort: sortBy(comparator), sortNamedMembers: name(comparator)},

    {separator: true},
  ];
}
