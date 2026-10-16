import ExpoModulesCore
#if canImport(FoundationModels)
import FoundationModels
#endif

// Apple Intelligence's on-device model (the Foundation Models framework, iOS 26+).
// It runs on the phone, is free, and needs no account. It works on iPhone 15 Pro and newer
// with Apple Intelligence turned on in Settings.
internal final class PhoneAiException: GenericException<String> {
  override var reason: String { param }
}

public class AbroadAiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AbroadAi")

    // Returns { status, reason, platform }. status: available | unavailable.
    // reason: device | off | notReady | language | os
    AsyncFunction("availability") { (lang: String) async -> [String: String] in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        return AppleModel.availability(lang: lang)
      }
      #endif
      return ["status": "unavailable", "reason": "os", "platform": "ios"]
    }

    // Apple downloads the model on its own after Apple Intelligence is turned on.
    AsyncFunction("download") { () async -> String in
      return "unsupported"
    }

    AsyncFunction("generate") { (prompt: String, maxTokens: Int) async throws -> String in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        return try await AppleModel.generate(prompt: prompt, maxTokens: maxTokens)
      }
      #endif
      throw PhoneAiException("This iPhone needs iOS 26 or newer for the built-in AI.")
    }
  }
}

#if canImport(FoundationModels)
@available(iOS 26.0, *)
enum AppleModel {
  static func availability(lang: String) -> [String: String] {
    let model = SystemLanguageModel.default
    switch model.availability {
    case .available:
      let code = String(lang.split(separator: "-").first ?? Substring(lang)).lowercased()
      let supported = model.supportedLanguages.contains { $0.languageCode?.identifier.lowercased() == code }
      return supported
        ? ["status": "available", "reason": "", "platform": "ios"]
        : ["status": "unavailable", "reason": "language", "platform": "ios"]
    case .unavailable(.deviceNotEligible):
      return ["status": "unavailable", "reason": "device", "platform": "ios"]
    case .unavailable(.appleIntelligenceNotEnabled):
      return ["status": "unavailable", "reason": "off", "platform": "ios"]
    case .unavailable(.modelNotReady):
      return ["status": "downloading", "reason": "notReady", "platform": "ios"]
    case .unavailable(_):
      return ["status": "unavailable", "reason": "device", "platform": "ios"]
    }
  }

  static func generate(prompt: String, maxTokens: Int) async throws -> String {
    // A fresh session per turn: the app sends the whole conversation in each prompt.
    let session = LanguageModelSession()
    let options = GenerationOptions(temperature: 0.7, maximumResponseTokens: maxTokens)
    do {
      let response = try await session.respond(to: prompt, options: options)
      return response.content
    } catch let error as LanguageModelSession.GenerationError {
      switch error {
      case .guardrailViolation:
        throw PhoneAiException("The phone's AI declined that turn. Try saying it another way.")
      case .exceededContextWindowSize:
        throw PhoneAiException("The conversation got too long for the phone's AI. Tap Start over.")
      case .unsupportedLanguageOrLocale:
        throw PhoneAiException("The phone's AI doesn't speak this language yet.")
      default:
        throw PhoneAiException("The phone's AI couldn't answer: \(error.localizedDescription)")
      }
    }
  }
}
#endif
