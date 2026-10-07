import { noAuthMessages } from "./auth";
import { noCoachesMessages } from "./coaches";
import { noCommonMessages } from "./common";
import { noDialogsMessages } from "./dialogs";
import { noHomeMessages } from "./home";
import { noLayoutMessages } from "./layout";
import { noPagesMessages } from "./pages";
import { noRankMessages } from "./rank";
import { noRegionsMessages } from "./regions";
import { noServicesMessages } from "./services";
import { noSupportMessages } from "./support";

export const noMessages = {
  ...noAuthMessages,
  ...noCoachesMessages,
  ...noCommonMessages,
  ...noDialogsMessages,
  ...noHomeMessages,
  ...noLayoutMessages,
  ...noPagesMessages,
  ...noRankMessages,
  ...noRegionsMessages,
  ...noServicesMessages,
  ...noSupportMessages,
} as const;
