import type { TFunction } from "i18next";

const errorMap: Record<string, string> = {
  "User already exists": "errors.userAlreadyExists",
  "Invalid username": "errors.invalidUsername",
  "The username must be at least 4 characters long": "errors.usernameMinLength",
  "The password must be at least 8 characters long": "errors.passwordMinLength",
  "The password must contain at least one numeric character": "errors.passwordNumeric",
  "The password must contain at least one uppercase letter": "errors.passwordUppercase",
  "The name cannot be empty or contain only spaces": "errors.nameRequired",
  "The surname cannot be empty or contain only spaces": "errors.surnameRequired",
  "The email cannot be empty or contain only spaces": "errors.emailRequired",
  "Incorrect current password": "errors.incorrectCurrentPassword",
  "Incorrect username or password": "errors.incorrectCredentials",
  "Username and password are required.": "errors.missingCredentials",
};

export function translateBackendError(message: string | undefined, t: TFunction) {
  if (!message) {
    return "";
  }

  const key = errorMap[message];
  return key ? t(key) : t("errors.fallback", { message });
}
