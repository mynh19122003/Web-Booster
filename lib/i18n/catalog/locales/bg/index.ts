import { bgAuthMessages } from "./auth";
import { bgCoachesMessages } from "./coaches";
import { bgCommonMessages } from "./common";
import { bgDialogsMessages } from "./dialogs";
import { bgHomeMessages } from "./home";
import { bgLayoutMessages } from "./layout";
import { bgPagesMessages } from "./pages";
import { bgRankMessages } from "./rank";
import { bgRegionsMessages } from "./regions";
import { bgServicesMessages } from "./services";
import { bgSupportMessages } from "./support";

export const bgMessages = {
  ...bgAuthMessages,
  ...bgCoachesMessages,
  ...bgCommonMessages,
  ...bgDialogsMessages,
  ...bgHomeMessages,
  ...bgLayoutMessages,
  ...bgPagesMessages,
  ...bgRankMessages,
  ...bgRegionsMessages,
  ...bgServicesMessages,
  ...bgSupportMessages,
} as const;
