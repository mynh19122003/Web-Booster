import { nlAuthMessages } from "./auth";
import { nlCoachesMessages } from "./coaches";
import { nlCommonMessages } from "./common";
import { nlDialogsMessages } from "./dialogs";
import { nlHomeMessages } from "./home";
import { nlLayoutMessages } from "./layout";
import { nlPagesMessages } from "./pages";
import { nlRankMessages } from "./rank";
import { nlRegionsMessages } from "./regions";
import { nlServicesMessages } from "./services";
import { nlSupportMessages } from "./support";

export const nlMessages = {
  ...nlAuthMessages,
  ...nlCoachesMessages,
  ...nlCommonMessages,
  ...nlDialogsMessages,
  ...nlHomeMessages,
  ...nlLayoutMessages,
  ...nlPagesMessages,
  ...nlRankMessages,
  ...nlRegionsMessages,
  ...nlServicesMessages,
  ...nlSupportMessages,
} as const;
