import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { AppSettings, BattleConsumableItem, GearItem, Pet } from "../types";
import {
  ExpeditionBattleOutcome,
  getBattleConsumableDescription,
  getBattleConsumableKindLabel,
  getExpeditionZoneBlueprint,
} from "../utils/gameplay";

interface BattleRewardModalProps {
  visible: boolean;
  settings: AppSettings;
  outcome: ExpeditionBattleOutcome | null;
  battlePet: Pet | null | undefined;
  gearItems: GearItem[];
  battleConsumables: BattleConsumableItem[];
  onClose: () => void;
  onEquipGear: (gearItemId: string, petId: string) => void;
}

interface BattleReplayFrame {
  attacker: "player" | "enemy";
  damage: number;
  playerHp: number;
  enemyHp: number;
  message: string;
}

interface BattleReplayPlan {
  frames: BattleReplayFrame[];
  playerMaxHp: number;
  enemyMaxHp: number;
}

const BATTLE_REPLAY_START_DELAY_MS = 450;
const BATTLE_REPLAY_STEP_MS = 700;

function createBattleReplayPlan(
  outcome: ExpeditionBattleOutcome,
  battlePetName: string,
): BattleReplayPlan {
  const playerMaxHp = Math.max(54, Math.round(60 + outcome.playerPower * 0.3));
  const enemyMaxHp = Math.max(54, Math.round(60 + outcome.enemyPower * 0.3));
  let playerDamage = Math.max(7, Math.round(outcome.playerPower * 0.22));
  let enemyDamage = Math.max(7, Math.round(outcome.enemyPower * 0.22));

  if (outcome.victory) {
    playerDamage = Math.max(playerDamage, enemyDamage + 2);
  } else {
    enemyDamage = Math.max(enemyDamage, playerDamage + 2);
  }

  let playerHp = playerMaxHp;
  let enemyHp = enemyMaxHp;
  let attacker: "player" | "enemy" = outcome.victory ? "player" : "enemy";
  const frames: BattleReplayFrame[] = [];

  while (playerHp > 0 && enemyHp > 0 && frames.length < 16) {
    if (attacker === "player") {
      const damage = Math.min(playerDamage, enemyHp);
      enemyHp = Math.max(0, enemyHp - damage);
      frames.push({
        attacker,
        damage,
        playerHp,
        enemyHp,
        message: `${battlePetName} attacks ${outcome.encounter.wildPetName} for ${damage} damage.`,
      });
      attacker = "enemy";
      continue;
    }

    const damage = Math.min(enemyDamage, playerHp);
    playerHp = Math.max(0, playerHp - damage);
    frames.push({
      attacker,
      damage,
      playerHp,
      enemyHp,
      message: `${outcome.encounter.wildPetName} hits back for ${damage} damage.`,
    });
    attacker = "player";
  }

  if (playerHp > 0 && enemyHp > 0) {
    if (outcome.victory) {
      frames.push({
        attacker: "player",
        damage: enemyHp,
        playerHp,
        enemyHp: 0,
        message: `${battlePetName} lands the finishing blow.`,
      });
    } else {
      frames.push({
        attacker: "enemy",
        damage: playerHp,
        playerHp: 0,
        enemyHp,
        message: `${outcome.encounter.wildPetName} overwhelms ${battlePetName}.`,
      });
    }
  }

  return {
    frames,
    playerMaxHp,
    enemyMaxHp,
  };
}

export default function BattleRewardModal({
  visible,
  settings,
  outcome,
  battlePet,
  gearItems,
  battleConsumables,
  onClose,
  onEquipGear,
}: BattleRewardModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const playerStrike = useRef(new Animated.Value(1)).current;
  const enemyStrike = useRef(new Animated.Value(1)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const [battleReplayPlan, setBattleReplayPlan] = useState<BattleReplayPlan | null>(
    null,
  );
  const [battleFrameIndex, setBattleFrameIndex] = useState(0);
  const [battleLine, setBattleLine] = useState("");
  const [battleReplayComplete, setBattleReplayComplete] = useState(false);

  useEffect(() => {
    if (!visible || !outcome || !battlePet) {
      return;
    }

    const replayPlan = createBattleReplayPlan(outcome, battlePet.name);

    setBattleReplayPlan(replayPlan);
    setBattleFrameIndex(0);
    setBattleLine(
      `${battlePet.name} faces ${outcome.encounter.wildPetName}.`,
    );
    setBattleReplayComplete(false);
    playerStrike.stopAnimation();
    enemyStrike.stopAnimation();
    impactOpacity.stopAnimation();
    playerStrike.setValue(1);
    enemyStrike.setValue(1);
    impactOpacity.setValue(0);

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    replayPlan.frames.forEach((frame, index) => {
      const timeoutId = setTimeout(() => {
        setBattleFrameIndex(index);
        setBattleLine(frame.message);

        const activeStrike =
          frame.attacker === "player" ? playerStrike : enemyStrike;
        const passiveStrike =
          frame.attacker === "player" ? enemyStrike : playerStrike;

        Animated.parallel([
          Animated.sequence([
            Animated.spring(activeStrike, {
              toValue: 1.08,
              damping: 10,
              stiffness: 180,
              mass: 0.7,
              useNativeDriver: true,
            }),
            Animated.spring(activeStrike, {
              toValue: 1,
              damping: 12,
              stiffness: 220,
              mass: 0.7,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.spring(passiveStrike, {
              toValue: 0.98,
              damping: 12,
              stiffness: 180,
              mass: 0.7,
              useNativeDriver: true,
            }),
            Animated.spring(passiveStrike, {
              toValue: 1,
              damping: 12,
              stiffness: 220,
              mass: 0.7,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(impactOpacity, {
              toValue: 1,
              duration: 110,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(impactOpacity, {
              toValue: 0,
              duration: 220,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]).start();

        if (index === replayPlan.frames.length - 1) {
          setBattleReplayComplete(true);
        }
      }, BATTLE_REPLAY_START_DELAY_MS + index * BATTLE_REPLAY_STEP_MS);

      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, [battlePet, impactOpacity, outcome, playerStrike, enemyStrike, visible]);

  if (!visible || !outcome || !battlePet) {
    return null;
  }

  const zone = getExpeditionZoneBlueprint(outcome.zoneIndex);
  const activeReplayPlan = battleReplayPlan
    ? battleReplayPlan
    : createBattleReplayPlan(outcome, battlePet.name);
  const currentFrame = activeReplayPlan.frames[battleFrameIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.8)" }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.shell, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {outcome.victory ? "Victory rewards" : "Battle report"}
                </Text>
                <Text style={[styles.subtitle, { color: theme.mutedText }]}>
                  {battlePet.name} • {zone.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}
                onPress={onClose}
              >
                <Text style={[styles.closeText, { color: theme.text }]}>
                  {copy.petsDetailClose}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentInner}
            >
              <View style={[styles.replayCard, { backgroundColor: theme.surface }]}>
                <View style={styles.replayHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Battle replay
                  </Text>
                  <View
                    style={[
                      styles.replayBadge,
                      {
                        backgroundColor: battleReplayComplete
                          ? outcome.victory
                            ? theme.accentSoft
                            : theme.warningSoft
                          : theme.surfaceMuted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.replayBadgeText,
                        {
                          color: battleReplayComplete
                            ? outcome.victory
                              ? theme.accent
                              : theme.warning
                            : theme.mutedText,
                        },
                      ]}
                    >
                      {battleReplayComplete ? (outcome.victory ? "Victory" : "Defeat") : "Fighting"}
                    </Text>
                  </View>
                </View>

                <View style={styles.replayArena}>
                  <Animated.View
                    style={[
                      styles.replayFighterCard,
                      {
                        backgroundColor: theme.accentSoft,
                        borderColor: theme.accent,
                        opacity: currentFrame && currentFrame.attacker === "player" ? 1 : 0.88,
                        transform: [{ scale: playerStrike }],
                      },
                    ]}
                  >
                    <Image
                      source={getPetImage(
                        battlePet.templateId,
                        battlePet.evolutionStage,
                        battlePet.activeImageVariantId,
                      )}
                      style={styles.replayPetImage}
                      resizeMode="contain"
                    />
                    <Text style={[styles.replayFighterName, { color: theme.text }]}>
                      {battlePet.name}
                    </Text>
                    <Text style={[styles.replayFighterMeta, { color: theme.mutedText }]}>
                      HP {Math.max(0, currentFrame ? currentFrame.playerHp : activeReplayPlan.playerMaxHp)}/
                      {activeReplayPlan.playerMaxHp}
                    </Text>
                    <View
                      style={[
                        styles.replayHpTrack,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <View
                        style={[
                          styles.replayHpFill,
                          {
                            width: `${Math.round(
                              ((currentFrame ? currentFrame.playerHp : activeReplayPlan.playerMaxHp) /
                                activeReplayPlan.playerMaxHp) *
                                100,
                            )}%`,
                            backgroundColor: theme.accent,
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>

                  <View style={styles.replayCenter}>
                    <View
                      style={[
                        styles.replayVersus,
                        { backgroundColor: theme.hero },
                      ]}
                    >
                      <Text style={[styles.replayVersusText, { color: theme.heroText }]}>
                        VS
                      </Text>
                    </View>
                    <Animated.View
                      style={[
                        styles.replayImpact,
                        {
                          opacity: impactOpacity,
                          backgroundColor: theme.warningSoft,
                        },
                      ]}
                    />
                    <Text style={[styles.replayLine, { color: theme.mutedText }]}>
                      {battleLine}
                    </Text>
                    <Text style={[styles.replayTurnText, { color: theme.text }]}>
                      Turn {Math.min(battleFrameIndex + 1, activeReplayPlan.frames.length)} /
                      {activeReplayPlan.frames.length}
                    </Text>
                  </View>

                  <Animated.View
                    style={[
                      styles.replayFighterCard,
                      {
                        backgroundColor: theme.surfaceMuted,
                        borderColor: theme.border,
                        opacity: currentFrame && currentFrame.attacker === "enemy" ? 1 : 0.88,
                        transform: [{ scale: enemyStrike }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.replayEnemyAvatar,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Text style={[styles.replayEnemyAvatarText, { color: theme.text }]}>
                        {outcome.encounter.wildPetName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.replayFighterName, { color: theme.text }]}>
                      {outcome.encounter.wildPetName}
                    </Text>
                    <Text style={[styles.replayFighterMeta, { color: theme.mutedText }]}>
                      HP {Math.max(0, currentFrame ? currentFrame.enemyHp : activeReplayPlan.enemyMaxHp)}/
                      {activeReplayPlan.enemyMaxHp}
                    </Text>
                    <View
                      style={[
                        styles.replayHpTrack,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <View
                        style={[
                          styles.replayHpFill,
                          {
                            width: `${Math.round(
                              ((currentFrame ? currentFrame.enemyHp : activeReplayPlan.enemyMaxHp) /
                                activeReplayPlan.enemyMaxHp) *
                                100,
                            )}%`,
                            backgroundColor: theme.danger,
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>
                </View>
              </View>

              {battleReplayComplete && (
                <>
                  <View style={[styles.hero, { backgroundColor: theme.surface }]}>
                    <Image
                      source={getPetImage(
                        battlePet.templateId,
                        battlePet.evolutionStage,
                        battlePet.activeImageVariantId,
                      )}
                      style={styles.petImage}
                      resizeMode="contain"
                    />
                    <View style={styles.heroBody}>
                      <Text style={[styles.petName, { color: theme.text }]}>
                        {battlePet.name}
                      </Text>
                      <Text style={[styles.petMeta, { color: theme.mutedText }]}>
                        {outcome.victory
                          ? "The wild pet was beaten."
                          : "The wild pet pushed back."}
                      </Text>
                      <Text style={[styles.petMeta, { color: theme.mutedText }]}>
                        Your power {outcome.playerPower} vs enemy {outcome.enemyPower}
                      </Text>
                      <Text style={[styles.petMeta, { color: theme.mutedText }]}>
                        XP gained: {outcome.xpReward}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.section, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Gear drops
                    </Text>
                    {gearItems.length === 0 ? (
                      <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                        No gear dropped this time.
                      </Text>
                    ) : (
                      <View style={styles.rewardList}>
                        {gearItems.map((gearItem) => (
                          <View
                            key={gearItem.id}
                            style={[
                              styles.rewardCard,
                              {
                                backgroundColor: theme.surfaceMuted,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text style={[styles.rewardName, { color: theme.text }]}>
                              {gearItem.name}
                            </Text>
                            <Text style={[styles.rewardMeta, { color: theme.mutedText }]}>
                              {gearItem.rarity} • {gearItem.bonusStats.attack}/{gearItem.bonusStats.defense}/{gearItem.bonusStats.speed}/{gearItem.bonusStats.luck}
                            </Text>
                            <TouchableOpacity
                              style={[
                                styles.equipButton,
                                { backgroundColor: theme.accent },
                              ]}
                              onPress={() => onEquipGear(gearItem.id, battlePet.id)}
                            >
                              <Text
                                style={[
                                  styles.equipButtonText,
                                  { color: theme.accentText },
                                ]}
                              >
                                Equip now
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={[styles.section, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Battle consumables
                    </Text>
                    {battleConsumables.length === 0 ? (
                      <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                        No consumable dropped this time.
                      </Text>
                    ) : (
                      <View style={styles.rewardList}>
                        {battleConsumables.map((item) => (
                          <View
                            key={item.id}
                            style={[
                              styles.rewardCard,
                              {
                                backgroundColor: theme.surfaceMuted,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text style={[styles.rewardName, { color: theme.text }]}>
                              {item.name}
                            </Text>
                            <Text style={[styles.rewardMeta, { color: theme.mutedText }]}>
                              {getBattleConsumableKindLabel(item.kind)} • {item.rarity}
                            </Text>
                            <Text style={[styles.rewardMeta, { color: theme.mutedText }]}>
                              {getBattleConsumableDescription(item.kind)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  closeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 14,
  },
  replayCard: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  replayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  replayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  replayBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  replayArena: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  replayFighterCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 8,
    alignItems: "center",
  },
  replayPetImage: {
    width: 92,
    height: 92,
  },
  replayFighterName: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  replayFighterMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  replayHpTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  replayHpFill: {
    height: "100%",
    borderRadius: 999,
  },
  replayCenter: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
  },
  replayVersus: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  replayVersusText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  replayImpact: {
    position: "absolute",
    top: "38%",
    width: 28,
    height: 28,
    borderRadius: 999,
  },
  replayLine: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  replayTurnText: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  replayEnemyAvatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  replayEnemyAvatarText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  hero: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
    alignItems: "center",
  },
  petImage: {
    width: 120,
    height: 120,
  },
  heroBody: {
    gap: 6,
    alignItems: "center",
  },
  petName: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  petMeta: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  section: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  rewardList: {
    gap: 10,
  },
  rewardCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: "800",
  },
  rewardMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  equipButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  equipButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
  },
});
