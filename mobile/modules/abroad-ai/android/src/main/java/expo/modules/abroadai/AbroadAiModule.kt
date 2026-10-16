package expo.modules.abroadai

import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.TextPart
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Gemini Nano, the AI model built into recent Android phones (Pixel 9 and newer, Galaxy S26, and others).
// Google only promises good results in English and Korean so far, so the app labels it as a preview.
class AiException(message: String) : CodedException("ERR_PHONE_AI", message, null)

class AbroadAiModule : Module() {
  private var client: GenerativeModel? = null
  private fun model(): GenerativeModel = client ?: Generation.getClient().also { client = it }

  override fun definition() = ModuleDefinition {
    Name("AbroadAi")

    // Returns { status, reason, platform }. status: available | downloadable | downloading | unavailable.
    AsyncFunction("availability") Coroutine { _: String ->
      val status = try { model().checkStatus() } catch (e: Exception) { -1 }
      val s = when (status) {
        FeatureStatus.AVAILABLE -> "available"
        FeatureStatus.DOWNLOADABLE -> "downloadable"
        FeatureStatus.DOWNLOADING -> "downloading"
        else -> "unavailable"
      }
      // Every language is allowed on Android: Google hasn't published a language list yet.
      mapOf("status" to s, "reason" to (if (s == "unavailable") "device" else ""), "platform" to "android", "preview" to true)
    }

    // Asks the phone to download Gemini Nano. Resolves when it is ready.
    AsyncFunction("download") Coroutine { ->
      var failure: String? = null
      model().download().collect { st ->
        if (st is DownloadStatus.DownloadFailed) failure = st.e.message ?: "The download failed."
      }
      failure?.let { throw AiException(it) }
      "available"
    }

    AsyncFunction("generate") Coroutine { prompt: String, maxTokens: Int ->
      try {
        val request = GenerateContentRequest.Builder(TextPart(prompt)).apply {
          temperature = 0.7f
          maxOutputTokens = maxTokens
        }.build()
        val response = model().generateContent(request)
        response.candidates.firstOrNull()?.text ?: ""
      } catch (e: CodedException) {
        throw e
      } catch (e: Exception) {
        throw AiException(e.message ?: "The phone's AI couldn't answer.")
      }
    }

    OnDestroy {
      client?.close()
      client = null
    }
  }
}
