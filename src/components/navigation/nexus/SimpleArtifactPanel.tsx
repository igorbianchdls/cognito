"use client";

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import { XIcon } from "lucide-react";

type SimpleArtifactPanelProps = {
  onClose?: () => void;
};

export default function SimpleArtifactPanel({ onClose }: SimpleArtifactPanelProps) {
  return (
    <Artifact className="h-full" hideTopBorder>
      <ArtifactHeader className="bg-white">
        <div className="flex flex-col">
          <ArtifactTitle>Artifact</ArtifactTitle>
          <ArtifactDescription>Painel simples de teste</ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction
            tooltip="Fechar"
            label="Fechar"
            icon={XIcon}
            onClick={onClose}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="p-4">
        <div className="text-sm text-gray-600">
          Este é um Artifact simples para testes. Você pode usá-lo para validar o layout em split com o chat.
        </div>
      </ArtifactContent>
    </Artifact>
  );
}

