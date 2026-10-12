// SmartCrew Gen C UI kit. Importing anything from here also loads Inter and the scoped screen CSS.
import "@fontsource-variable/inter";
import "../screens.css";

export { Icon, ICON_NAMES, type IconName, type IconProps } from "./Icon";
export { WebShell, Logo, NAV, type NavKey, type WebShellProps } from "./WebShell";
export { PhoneShell, StatusBar, TabBar, type PhoneTab, type PhoneShellProps } from "./PhoneShell";
export { MapPanel, MAP_WORLD, type MapPin, type MapPanelProps } from "./MapPanel";
export {
  Badge,
  Pill,
  Button,
  IconButton,
  Segmented,
  Kpi,
  Card,
  Toolbar,
  Search,
  Select,
  Table,
  Cell2,
  PersonCell,
  Avatar,
  Checkbox,
  Pager,
  Hours,
  Field,
  Input,
  Choice,
  PhoneButton,
  CircleButton,
  PhoneHeader,
  type Column,
  type SegItem,
  type PillTone,
  type BadgeTone,
  type ButtonVariant,
} from "./ui";
export * from "./format";
