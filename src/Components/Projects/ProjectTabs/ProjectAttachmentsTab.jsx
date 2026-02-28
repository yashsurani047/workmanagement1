import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Paperclip,
  X,
  Link2,
  Plus,
  Upload,
  ExternalLink,
  FileText,
  ChevronLeft,
  FolderPlus,
  Loader,
} from "lucide-react-native";
import { useTheme } from "../../../Themes/ThemeContext";

export default function ProjectAttachmentsTab({
  styles,
  formData,
  setFormData,
  addLink,
  removeLink,
  removeAttachment,
  onAddImagesPress,
  showPermissionModal,
  setShowPermissionModal,
  handleFilePick,
  handleSave,
  isSubmitting,
  isEditMode,
  setActiveTab,
}) {
  const { theme } = useTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <View style={styles.tabContent}>
        {/* ─── Project Links ─── */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Link2 size={16} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>
              Project Links
            </Text>
          </View>

          {formData.links.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                textAlign: "center",
                paddingVertical: 12,
                fontWeight: "500",
              }}
            >
              No links added
            </Text>
          ) : (
            <View style={{ gap: 8, marginBottom: 12 }}>
              {formData.links.map((link, i) => (
                <View
                  key={link.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: `${theme.colors.primary}12`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <ExternalLink size={18} color={theme.colors.primary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}
                      numberOfLines={1}
                    >
                      {link.title}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: theme.colors.primary, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {link.url}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeLink(i)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: `${theme.colors.error}12`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                    }}
                  >
                    <X size={16} color={theme.colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add link inputs */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: formData.linkUrl ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                fontWeight: "500",
                color: theme.colors.text,
              }}
              placeholder="URL"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.linkUrl}
              onChangeText={(v) => setFormData((prev) => ({ ...prev, linkUrl: v }))}
            />
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: formData.linkTitle ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                fontWeight: "500",
                color: theme.colors.text,
              }}
              placeholder="Title"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.linkTitle}
              onChangeText={(v) => setFormData((prev) => ({ ...prev, linkTitle: v }))}
            />
          </View>

          <TouchableOpacity
            onPress={addLink}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: theme.colors.project,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Add Link</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Attachments ─── */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: `${theme.colors.task}15`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Paperclip size={16} color={theme.colors.task} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>
              Attachments
            </Text>
          </View>

          {formData.attachments.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                textAlign: "center",
                paddingVertical: 12,
                fontWeight: "500",
              }}
            >
              No images added
            </Text>
          ) : (
            <View style={{ gap: 8, marginBottom: 12 }}>
              {formData.attachments.map((f, i) => (
                <View
                  key={f.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  {f.uri ? (
                    <Image
                      source={{ uri: f.uri }}
                      style={{ width: 42, height: 42, borderRadius: 10, marginRight: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        backgroundColor: `${theme.colors.task}12`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <FileText size={20} color={theme.colors.task} strokeWidth={1.8} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}
                      numberOfLines={1}
                    >
                      {f.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(i)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: `${theme.colors.error}12`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} color={theme.colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            onPress={onAddImagesPress}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              borderStyle: "dashed",
              backgroundColor: theme.colors.muted100,
            }}
          >
            <Upload size={18} color={theme.colors.primary} strokeWidth={2} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.primary }}>
              Add Images
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Permission Modal ─── */}
        <Modal
          visible={showPermissionModal}
          transparent
          onRequestClose={() => setShowPermissionModal(false)}
          animationType="fade"
        >
          <TouchableWithoutFeedback onPress={() => setShowPermissionModal(false)}>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <TouchableWithoutFeedback>
                <View
                  style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 20,
                    padding: 24,
                    width: "85%",
                    maxWidth: 360,
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: theme.colors.text,
                      marginBottom: 10,
                    }}
                  >
                    Allow access to your photos
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.textSecondary,
                      marginBottom: 20,
                      lineHeight: 20,
                    }}
                  >
                    We need permission to access your photo library so you can attach images to this
                    project.
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setShowPermissionModal(false)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.card,
                      }}
                    >
                      <Text style={{ color: theme.colors.text, fontWeight: "600", fontSize: 14 }}>
                        Not now
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowPermissionModal(false);
                        setTimeout(handleFilePick, 100);
                      }}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: theme.colors.primary,
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                        Continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ─── Footer Buttons ─── */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: "auto", paddingTop: 20 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("team")}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            }}
          >
            <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.8}
            style={{
              flex: 1.5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: theme.colors.primary,
              opacity: isSubmitting ? 0.5 : 1,
              shadowColor: theme.colors.primary,
              shadowOpacity: isSubmitting ? 0 : 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: isSubmitting ? 0 : 6,
            }}
          >
            {isSubmitting ? (
              <Loader size={18} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <FolderPlus size={18} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.2 }}>
              {isEditMode ? "Update" : "Create"} Project
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
