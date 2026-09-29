import React, { useEffect, useState } from "react";
import {
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
import { AppSettings, GameState } from "../types";
import {
  COMPANIONS,
  getBondProgress,
  getCompanionDefinition,
  getNextEvolutionBond,
  STARTER_TEMPLATE_IDS,
} from "../utils/companions";
import { getPetTemplates } from "../utils/gameplay";
import { getCalendarDayDifference } from "../utils/taskSchedule";

interface CompanionsScreenProps {
  gameState: GameState;
  settings: AppSettings;
  tutorialMode: "choose" | null;
  onChooseStarter: (templateId: string) => void;
  onEquipPet: (petId: string) => void;
}

export default function CompanionsScreen({
  gameState,
  settings,
  tutorialMode,
  onChooseStarter,
  onEquipPet,
}: CompanionsScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const now = Date.now();
  const [selectedPetId, setSelectedPetId] = useState("");
  const ownedTemplateIds = new Set(gameState.pets.map((pet) => pet.templateId));
  const notMetCompanions = COMPANIONS.filter(
    (companion) => !ownedTemplateIds.has(companion.templateId),
  );
  const needsStarter = gameState.pets.length === 0;

  useEffect(() => {
    if (selectedPetId !== "" && !gameState.pets.some((pet) => pet.id === selectedPetId)) {
      setSelectedPetId("");
    }
  }, [gameState, selectedPetId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {copy.petsTitle}
        </Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          {gameState.pets.length}/{COMPANIONS.length} • {gameState.coins}{" "}
          {copy.petsCoinsPity}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
      >
        {needsStarter ? (
          <StarterPicker
            settings={settings}
            highlighted={tutorialMode !== null}
            onChooseStarter={onChooseStarter}
          />
        ) : (
          <View style={styles.grid}>
            {gameState.pets.map((pet) => (
              <PetCard
                key={pet.id}
                gameState={gameState}
                petId={pet.id}
                settings={settings}
                now={now}
                onPress={() => setSelectedPetId(pet.id)}
                onEquipPet={onEquipPet}
              />
            ))}
            {notMetCompanions.map((companion) => (
              <NotMetCard
                key={companion.templateId}
                gameState={gameState}
                templateId={companion.templateId}
                settings={settings}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CompanionDetailModal
        visible={selectedPetId !== ""}
        gameState={gameState}
        settings={settings}
        petId={selectedPetId}
        onClose={() => setSelectedPetId("")}
        onEquipPet={onEquipPet}
      />
    </SafeAreaView>
  );
}

function getEvolutionLabel(
  evolutionStage: number,
  copy: ReturnType<typeof getAppCopy>,
): string {
  return evolutionStage === 2
    ? copy.petsEvolutionAscended
    : evolutionStage === 1
      ? copy.petsEvolutionEvolved
      : copy.petsEvolutionBase;
}

function BondBar({
  bond,
  settings,
}: {
  bond: number;
  settings: AppSettings;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const nextEvolutionBond = getNextEvolutionBond(bond);

  return (
    <>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.companionBond}: {bond}
        {nextEvolutionBond === null
          ? ` • ${copy.petsMaxEvolution}`
          : ` • ${copy.companionNextEvolution.replace("{bond}", String(nextEvolutionBond))}`}
      </Text>
      <View
        style={[
          styles.xpProgressTrack,
          { backgroundColor: theme.surfaceMuted },
        ]}
      >
        <View
          style={[
            styles.xpProgressFill,
            {
              width: `${Math.round(getBondProgress(bond) * 100)}%`,
              backgroundColor: theme.accent,
            },
          ]}
        />
      </View>
    </>
  );
}

function PetCard({
  gameState,
  petId,
  settings,
  now,
  onPress,
  onEquipPet,
}: {
  gameState: GameState;
  petId: string;
  settings: AppSettings;
  now: number;
  onPress: () => void;
  onEquipPet: (petId: string) => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const pet = gameState.pets.filter((currentPet) => currentPet.id === petId)[0];
  const style = getCompanionDefinition(pet.templateId)?.style;
  const daysTogether = getCalendarDayDifference(pet.createdAt, now) + 1;

  return (
    <TouchableOpacity
      style={[styles.petCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={getPetImage(
          pet.templateId,
          pet.evolutionStage,
          pet.activeImageVariantId,
        )}
        style={styles.petCardImage}
        resizeMode="contain"
      />
      <View style={styles.petCardHeader}>
        <View>
          <Text style={[styles.petName, { color: theme.text }]}>
            {pet.name}
          </Text>
          <Text style={[styles.petMeta, { color: theme.mutedText }]}>
            {getEvolutionLabel(pet.evolutionStage, copy)}
            {style
              ? ` • ${copy.companionLoves} ${copy.companionStyles[style].loves}`
              : ""}
          </Text>
        </View>
        {pet.equipped && (
          <Text
            style={[
              styles.equippedBadge,
              { backgroundColor: theme.accentSoft, color: theme.accent },
            ]}
          >
            {copy.petsActive}
          </Text>
        )}
      </View>
      <BondBar bond={pet.bond} settings={settings} />
      {style && (
        <Text style={[styles.petStat, { color: theme.mutedText }]}>
          {copy.companionPerk}: {copy.companionStyles[style].perk}
        </Text>
      )}
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.companionDaysTogether}: {daysTogether}
      </Text>
      <View style={styles.petActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.accent },
            pet.equipped && { backgroundColor: theme.border },
          ]}
          onPress={() => onEquipPet(pet.id)}
          disabled={pet.equipped}
        >
          <Text style={styles.actionButtonText}>
            {pet.equipped ? copy.petsActive : copy.companionTakeAlong}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/** A companion the player hasn't met: silhouette, the style it loves and how close it is to joining. */
function NotMetCard({
  gameState,
  templateId,
  settings,
}: {
  gameState: GameState;
  templateId: string;
  settings: AppSettings;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const companion = getCompanionDefinition(templateId);
  if (!companion) {
    return null;
  }
  const styleCopy = copy.companionStyles[companion.style];
  const progress = companion.joinProgress(gameState.usage);

  return (
    <View
      style={[
        styles.petCard,
        styles.notMetCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* A "?" instead of a silhouette until the art has transparent backgrounds (GAME_REDESIGN §8). */}
      <View style={[styles.notMetBadge, { backgroundColor: theme.surfaceMuted }]}>
        <Text style={[styles.notMetBadgeText, { color: theme.mutedText }]}>?</Text>
      </View>
      <View style={styles.notMetBody}>
        <Text style={[styles.petName, { color: theme.text }]}>
          {copy.companionNotMet}
        </Text>
        <Text style={[styles.petMeta, { color: theme.mutedText }]}>
          {copy.companionLoves} {styleCopy.loves}
        </Text>
        <Text style={[styles.petStat, { color: theme.mutedText }]}>
          {styleCopy.joins.replace("{target}", String(progress.target))}
          {progress.target > 1 ? ` (${progress.current}/${progress.target})` : ""}
        </Text>
      </View>
    </View>
  );
}

function StarterPicker({
  settings,
  highlighted,
  onChooseStarter,
}: {
  settings: AppSettings;
  highlighted: boolean;
  onChooseStarter: (templateId: string) => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const templates = getPetTemplates();

  return (
    <View
      style={[
        styles.shopCard,
        { backgroundColor: theme.surface },
        highlighted && styles.tutorialHighlight,
      ]}
    >
      <Text style={[styles.shopTitle, { color: theme.text }]}>
        {copy.companionChooseTitle}
      </Text>
      <Text style={[styles.shopText, { color: theme.mutedText }]}>
        {copy.companionChooseSubtitle}
      </Text>
      <View style={styles.grid}>
        {STARTER_TEMPLATE_IDS.map((templateId) => {
          const template = templates.find((item) => item.id === templateId);
          const style = getCompanionDefinition(templateId)?.style;
          if (!template || !style) {
            return null;
          }

          return (
            <View
              key={templateId}
              style={[
                styles.starterCard,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <Image
                source={getPetImage(templateId, 0, "default")}
                style={styles.petCardImage}
                resizeMode="contain"
              />
              <Text style={[styles.petName, { color: theme.text }]}>
                {template.name}
              </Text>
              <Text style={[styles.petMeta, { color: theme.mutedText }]}>
                {copy.companionLoves} {copy.companionStyles[style].loves}
              </Text>
              <Text style={[styles.petStat, { color: theme.mutedText }]}>
                {template.description}
              </Text>
              <Text style={[styles.petStat, { color: theme.text }]}>
                {copy.companionPerk}: {copy.companionStyles[style].perk}
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.accent }]}
                onPress={() => onChooseStarter(templateId)}
              >
                <Text style={styles.actionButtonText}>
                  {copy.companionChoose}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}


function CompanionDetailModal({
  visible,
  gameState,
  settings,
  petId,
  onClose,
  onEquipPet,
}: {
  visible: boolean;
  gameState: GameState;
  settings: AppSettings;
  petId: string;
  onClose: () => void;
  onEquipPet: (petId: string) => void;
}) {
  const pet = gameState.pets.find((currentPet) => currentPet.id === petId);
  if (!visible || !pet) {
    return null;
  }

  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const petTemplate = getPetTemplates().find(
    (template) => template.id === pet.templateId,
  );
  const style = getCompanionDefinition(pet.templateId)?.style;
  const daysTogether = getCalendarDayDifference(pet.createdAt, Date.now()) + 1;
  const quickStats = [
    { label: copy.companionBond, value: String(pet.bond) },
    { label: copy.petsEvolution, value: getEvolutionLabel(pet.evolutionStage, copy) },
    { label: copy.companionDaysTogether, value: String(daysTogether) },
    { label: copy.petsTaskBonus, value: `+${(pet.taskMultiplier * 100).toFixed(0)}%` },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.detailModal, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.detailHeader,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <View>
            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {copy.petsDetailTitle}
            </Text>
            <Text style={[styles.detailSubtitle, { color: theme.mutedText }]}>
              {pet.name}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.detailCloseButton,
              { backgroundColor: theme.surfaceMuted },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.detailCloseText, { color: theme.text }]}>
              {copy.petsDetailClose}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailScrollContent}
        >
          <View style={[styles.detailHero, { backgroundColor: theme.surface }]}>
            <Image
              source={getPetImage(
                pet.templateId,
                pet.evolutionStage,
                pet.activeImageVariantId,
              )}
              style={styles.detailHeroImage}
              resizeMode="contain"
            />
            <View style={styles.detailHeroBody}>
              <View style={styles.detailBadgeRow}>
                {style && (
                  <View
                    style={[
                      styles.detailBadge,
                      { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Text
                      style={[styles.detailBadgeText, { color: theme.accent }]}
                    >
                      {copy.companionLoves} {copy.companionStyles[style].loves}
                    </Text>
                  </View>
                )}
                {petTemplate && (
                  <View
                    style={[
                      styles.detailBadge,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailBadgeText,
                        { color: theme.mutedText },
                      ]}
                    >
                      {petTemplate.element.charAt(0).toUpperCase() +
                        petTemplate.element.slice(1)}
                    </Text>
                  </View>
                )}
                {pet.equipped && (
                  <View
                    style={[styles.detailBadge, { backgroundColor: theme.hero }]}
                  >
                    <Text
                      style={[
                        styles.detailBadgeText,
                        { color: theme.heroText },
                      ]}
                    >
                      {copy.petsActive}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.detailPetName, { color: theme.text }]}>
                {pet.name}
              </Text>
              {petTemplate && (
                <Text
                  style={[
                    styles.detailPetDescription,
                    { color: theme.mutedText },
                  ]}
                >
                  {petTemplate.description}
                </Text>
              )}

              <View style={styles.detailQuickStats}>
                {quickStats.map((stat) => (
                  <View
                    key={stat.label}
                    style={[
                      styles.detailQuickStatCard,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailQuickStatLabel,
                        { color: theme.mutedText },
                      ]}
                    >
                      {stat.label}
                    </Text>
                    <Text
                      style={[
                        styles.detailQuickStatValue,
                        { color: theme.text },
                      ]}
                    >
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
              <BondBar bond={pet.bond} settings={settings} />
              {style && (
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {copy.companionPerk}: {copy.companionStyles[style].perk}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.detailActionButton,
                  { backgroundColor: theme.accent },
                  pet.equipped && { backgroundColor: theme.border },
                ]}
                onPress={() => onEquipPet(pet.id)}
                disabled={pet.equipped}
              >
                <Text
                  style={[
                    styles.detailActionButtonText,
                    {
                      color: pet.equipped ? theme.mutedText : theme.accentText,
                    },
                  ]}
                >
                  {pet.equipped ? copy.petsActive : copy.companionTakeAlong}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  tutorialHighlight: {
    borderWidth: 2,
    borderColor: "#ffd166",
    shadowColor: "#ffd166",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  shopCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  shopTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  shopText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  grid: {
    gap: 12,
  },
  notMetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  notMetBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  notMetBadgeText: {
    fontSize: 26,
    fontWeight: "700",
  },
  notMetBody: {
    flex: 1,
  },
  starterCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  petCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  petCardImage: {
    width: 96,
    height: 96,
    alignSelf: "center",
    marginBottom: 8,
  },
  petCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  petName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  petMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  equippedBadge: {
    backgroundColor: "#dff8f4",
    color: "#1f7a73",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  petStat: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
  },
  xpProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  petActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: "#1f7a73",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  detailModal: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  detailSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  detailCloseButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  detailCloseText: {
    fontSize: 13,
    fontWeight: "700",
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 16,
    gap: 14,
  },
  detailHero: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  detailHeroImage: {
    width: 140,
    height: 140,
    alignSelf: "center",
  },
  detailHeroBody: {
    gap: 12,
  },
  detailBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  detailPetName: {
    fontSize: 26,
    fontWeight: "800",
  },
  detailPetDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailQuickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailQuickStatCard: {
    flexBasis: "48%",
    borderRadius: 14,
    padding: 12,
  },
  detailQuickStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailQuickStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  detailText: {
    fontSize: 13,
    lineHeight: 19,
  },
  detailActionButton: {
    minWidth: "48%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  detailActionButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  contentInner: {
    padding: 16,
  },
});
