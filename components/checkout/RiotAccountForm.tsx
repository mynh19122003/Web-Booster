"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { parseRiotId } from "@/lib/riot-id";
import type { RiotAccountDetails } from "@/lib/order-request-types";

interface RiotAccountFormProps {
  onChange?: (data: RiotAccountDetails) => void;
  disabled?: boolean;
}

export default function RiotAccountForm({
  onChange,
  disabled = false,
}: RiotAccountFormProps) {
  const { language } = useLanguage();
  const copy = (english: string, vietnamese: string) =>
    translateText(language, english, vietnamese);
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RiotAccountDetails>({
    riotUsername: "",
    riotPass: "",
    riotIdTag: "",
  });
  function change(field: keyof RiotAccountDetails, value: string) {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange?.(updated);
  }

  return (
    <fieldset
      className="riot-checkout-account"
      disabled={disabled}
      aria-describedby={`${id}-description`}
    >
      <legend className="sr-only">
        {copy("Riot Games Account", "Tài khoản Riot Games")}
      </legend>
      <div className="riot-checkout-heading">
        <div>
          <h3>{copy("Riot Games Account", "Tài khoản Riot Games")}</h3>
          <p id={`${id}-description`}>
            {copy(
              "Account credentials required for your assigned booster to fulfill this order.",
              "Thông tin đăng nhập để booster được phân công hoàn thành đơn hàng.",
            )}
          </p>
        </div>
        <span className="riot-checkout-security">
          <ShieldCheck size={15} />
          {copy("Encrypted at rest", "Mã hóa khi lưu trữ")}
        </span>
      </div>
      <div className="riot-checkout-grid">
        <label className="riot-checkout-wide" htmlFor={`${id}-riot-id`}>
          <span>
            {copy("Riot ID & Tagline", "Riot ID & Tagline")} <b>*</b>
          </span>
          <input
            id={`${id}-riot-id`}
            name="riotIdTag"
            type="text"
            required
            maxLength={121}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. Faker#KR1"
            value={formData.riotIdTag}
            onChange={(event) => {
              change("riotIdTag", event.target.value);
              event.target.setCustomValidity(
                parseRiotId(event.target.value)
                  ? ""
                  : copy(
                      "Enter a Riot ID in Name#TAG format.",
                      "Nhập Riot ID theo định dạng Tên#TAG.",
                    ),
              );
            }}
          />
        </label>
        <label htmlFor={`${id}-username`}>
          <span>
            {copy("Riot Username / Login ID", "Tên đăng nhập Riot")} <b>*</b>
          </span>
          <input
            id={`${id}-username`}
            name="riotUsername"
            type="text"
            required
            maxLength={120}
            pattern=".*\S.*"
            autoComplete="off"
            spellCheck={false}
            placeholder={copy(
              "Account login username",
              "Tên đăng nhập tài khoản",
            )}
            value={formData.riotUsername}
            onChange={(event) => change("riotUsername", event.target.value)}
          />
        </label>
        <div className="riot-checkout-password-field">
          <label htmlFor={`${id}-password`}>
            <span>
              {copy("Password", "Mật khẩu")} <b>*</b>
            </span>
          </label>
          <div className="riot-checkout-password">
            <input
              id={`${id}-password`}
              name="riotPass"
              type={showPassword ? "text" : "password"}
              required
              maxLength={128}
              pattern=".*\S.*"
              autoComplete="off"
              spellCheck={false}
              placeholder="••••••••••••"
              value={formData.riotPass}
              onChange={(event) => change("riotPass", event.target.value)}
            />
            <button
              type="button"
              aria-controls={`${id}-password`}
              aria-pressed={showPassword}
              aria-label={
                showPassword
                  ? copy("Hide password", "Ẩn mật khẩu")
                  : copy("Show password", "Hiện mật khẩu")
              }
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
      <p className="riot-checkout-private">
        {copy(
          "Only the employee assigned to your order can access these details. They are never saved in this browser or sent as chat messages.",
          "Chỉ nhân viên được phân công có thể xem thông tin này. Thông tin không lưu trong trình duyệt hoặc gửi qua tin nhắn chat.",
        )}
      </p>
    </fieldset>
  );
}
