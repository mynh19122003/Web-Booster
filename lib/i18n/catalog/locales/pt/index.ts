import { ptAuthMessages } from "./auth";
import { ptCoachesMessages } from "./coaches";
import { ptCommonMessages } from "./common";
import { ptDialogsMessages } from "./dialogs";
import { ptHomeMessages } from "./home";
import { ptLayoutMessages } from "./layout";
import { ptPagesMessages } from "./pages";
import { ptRankMessages } from "./rank";
import { ptRegionsMessages } from "./regions";
import { ptServicesMessages } from "./services";
import { ptSupportMessages } from "./support";

export const ptMessages = {
  ...ptAuthMessages,
  ...ptCoachesMessages,
  ...ptCommonMessages,
  ...ptDialogsMessages,
  ...ptHomeMessages,
  ...ptLayoutMessages,
  ...ptPagesMessages,
  ...ptRankMessages,
  ...ptRegionsMessages,
  ...ptServicesMessages,
  ...ptSupportMessages,
} as const;
