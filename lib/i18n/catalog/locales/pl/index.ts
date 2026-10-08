import { plAuthMessages } from "./auth";
import { plCoachesMessages } from "./coaches";
import { plCommonMessages } from "./common";
import { plDialogsMessages } from "./dialogs";
import { plHomeMessages } from "./home";
import { plLayoutMessages } from "./layout";
import { plPagesMessages } from "./pages";
import { plRankMessages } from "./rank";
import { plRegionsMessages } from "./regions";
import { plServicesMessages } from "./services";
import { plSupportMessages } from "./support";

export const plMessages = {
  ...plAuthMessages,
  ...plCoachesMessages,
  ...plCommonMessages,
  ...plDialogsMessages,
  ...plHomeMessages,
  ...plLayoutMessages,
  ...plPagesMessages,
  ...plRankMessages,
  ...plRegionsMessages,
  ...plServicesMessages,
  ...plSupportMessages,
} as const;
