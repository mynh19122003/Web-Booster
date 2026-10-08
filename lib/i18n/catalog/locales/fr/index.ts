import { frAuthMessages } from "./auth";
import { frCoachesMessages } from "./coaches";
import { frCommonMessages } from "./common";
import { frDialogsMessages } from "./dialogs";
import { frHomeMessages } from "./home";
import { frLayoutMessages } from "./layout";
import { frPagesMessages } from "./pages";
import { frRankMessages } from "./rank";
import { frRegionsMessages } from "./regions";
import { frServicesMessages } from "./services";
import { frSupportMessages } from "./support";

export const frMessages = {
  ...frAuthMessages,
  ...frCoachesMessages,
  ...frCommonMessages,
  ...frDialogsMessages,
  ...frHomeMessages,
  ...frLayoutMessages,
  ...frPagesMessages,
  ...frRankMessages,
  ...frRegionsMessages,
  ...frServicesMessages,
  ...frSupportMessages,
} as const;
