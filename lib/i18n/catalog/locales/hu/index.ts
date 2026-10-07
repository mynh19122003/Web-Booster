import { huAuthMessages } from "./auth";
import { huCoachesMessages } from "./coaches";
import { huCommonMessages } from "./common";
import { huDialogsMessages } from "./dialogs";
import { huHomeMessages } from "./home";
import { huLayoutMessages } from "./layout";
import { huPagesMessages } from "./pages";
import { huRankMessages } from "./rank";
import { huRegionsMessages } from "./regions";
import { huServicesMessages } from "./services";
import { huSupportMessages } from "./support";

export const huMessages = {
  ...huAuthMessages,
  ...huCoachesMessages,
  ...huCommonMessages,
  ...huDialogsMessages,
  ...huHomeMessages,
  ...huLayoutMessages,
  ...huPagesMessages,
  ...huRankMessages,
  ...huRegionsMessages,
  ...huServicesMessages,
  ...huSupportMessages,
} as const;
