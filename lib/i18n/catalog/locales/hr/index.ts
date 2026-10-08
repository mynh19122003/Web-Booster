import { hrAuthMessages } from "./auth";
import { hrCoachesMessages } from "./coaches";
import { hrCommonMessages } from "./common";
import { hrDialogsMessages } from "./dialogs";
import { hrHomeMessages } from "./home";
import { hrLayoutMessages } from "./layout";
import { hrPagesMessages } from "./pages";
import { hrRankMessages } from "./rank";
import { hrRegionsMessages } from "./regions";
import { hrServicesMessages } from "./services";
import { hrSupportMessages } from "./support";

export const hrMessages = {
  ...hrAuthMessages,
  ...hrCoachesMessages,
  ...hrCommonMessages,
  ...hrDialogsMessages,
  ...hrHomeMessages,
  ...hrLayoutMessages,
  ...hrPagesMessages,
  ...hrRankMessages,
  ...hrRegionsMessages,
  ...hrServicesMessages,
  ...hrSupportMessages,
} as const;
