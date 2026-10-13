package expo.modules.growraappupdate

import android.app.Activity
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Google Play in-app updates for Growra. Mirrors the API of the Capacitor plugin used in the
 * other apps: check, startFlexible, completeFlexible, startImmediate, plus "onProgress" events.
 * Every failure (not installed from Play, no Play Store, offline) reads as "no update".
 */
class GrowraAppUpdateModule : Module() {
  private var manager: AppUpdateManager? = null
  private var listener: InstallStateUpdatedListener? = null
  private var pendingStart: Promise? = null

  private fun manager(): AppUpdateManager? {
    if (manager == null) {
      val context = appContext.reactContext ?: return null
      manager = AppUpdateManagerFactory.create(context)
    }
    return manager
  }

  private fun startFlow(type: Int, promise: Promise) {
    val updates = manager()
    val activity = appContext.currentActivity
    if (updates == null || activity == null) {
      promise.resolve(false)
      return
    }
    updates.appUpdateInfo
      .addOnSuccessListener { info ->
        val canStart = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE ||
          info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
        if (!canStart || !info.isUpdateTypeAllowed(type)) {
          promise.resolve(false)
          return@addOnSuccessListener
        }
        try {
          pendingStart?.resolve(false)
          pendingStart = promise
          val started = updates.startUpdateFlowForResult(
            info,
            activity,
            AppUpdateOptions.newBuilder(type).build(),
            REQUEST_CODE
          )
          if (!started) {
            pendingStart = null
            promise.resolve(false)
          }
        } catch (error: Exception) {
          pendingStart = null
          promise.resolve(false)
        }
      }
      .addOnFailureListener { promise.resolve(false) }
  }

  override fun definition() = ModuleDefinition {
    Name("GrowraAppUpdate")

    Events("onProgress")

    AsyncFunction("check") { promise: Promise ->
      val updates = manager()
      if (updates == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      updates.appUpdateInfo
        .addOnSuccessListener { info ->
          promise.resolve(
            mapOf(
              "available" to (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE),
              "priority" to info.updatePriority(),
              "flexibleAllowed" to info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE),
              "immediateAllowed" to info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE),
              "downloaded" to (info.installStatus() == InstallStatus.DOWNLOADED)
            )
          )
        }
        .addOnFailureListener { promise.resolve(null) }
    }

    AsyncFunction("startFlexible") { promise: Promise ->
      val updates = manager()
      if (updates != null && listener == null) {
        val progressListener = InstallStateUpdatedListener { state ->
          sendEvent(
            "onProgress",
            mapOf(
              "status" to state.installStatus(),
              "bytesDownloaded" to state.bytesDownloaded().toDouble(),
              "totalBytesToDownload" to state.totalBytesToDownload().toDouble()
            )
          )
        }
        updates.registerListener(progressListener)
        listener = progressListener
      }
      startFlow(AppUpdateType.FLEXIBLE, promise)
    }

    AsyncFunction("startImmediate") { promise: Promise ->
      startFlow(AppUpdateType.IMMEDIATE, promise)
    }

    AsyncFunction("completeFlexible") {
      manager()?.completeUpdate()
    }

    // Play reports the player's choice in the update dialog through onActivityResult.
    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_CODE) return@OnActivityResult
      pendingStart?.resolve(payload.resultCode == Activity.RESULT_OK)
      pendingStart = null
    }

    OnDestroy {
      listener?.let { manager?.unregisterListener(it) }
      listener = null
    }
  }

  companion object {
    private const val REQUEST_CODE = 7161
  }
}
