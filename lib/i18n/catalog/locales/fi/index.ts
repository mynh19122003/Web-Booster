import { fiAuthMessages } from "./auth";
import { fiCoachesMessages } from "./coaches";
import { fiCommonMessages } from "./common";
import { fiDialogsMessages } from "./dialogs";
import { fiHomeMessages } from "./home";
import { fiLayoutMessages } from "./layout";
import { fiPagesMessages } from "./pages";
import { fiRankMessages } from "./rank";
import { fiRegionsMessages } from "./regions";
import { fiServicesMessages } from "./services";
import { fiSupportMessages } from "./support";

export const fiMessages = {
  ...fiAuthMessages,
  ...fiCoachesMessages,
  ...fiCommonMessages,
  ...fiDialogsMessages,
  ...fiHomeMessages,
  ...fiLayoutMessages,
  ...fiPagesMessages,
  ...fiRankMessages,
  ...fiRegionsMessages,
  ...fiServicesMessages,
  ...fiSupportMessages,
} as const;
