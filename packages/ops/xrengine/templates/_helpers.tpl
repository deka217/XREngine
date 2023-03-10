{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
# {{- define "xrengine.name" -}}
# {{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
# {{- end -}}

{{- define "xrengine.taskserver.name" -}}
{{- default .Chart.Name .Values.taskserver.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "xrengine.client.name" -}}
{{- default .Chart.Name .Values.client.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "xrengine.api.name" -}}
{{- default .Chart.Name .Values.api.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "xrengine.media.name" -}}
{{- default .Chart.Name .Values.media.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "xrengine.instanceserver.name" -}}
{{- default .Chart.Name .Values.instanceserver.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "xrengine.testbot.name" -}}
{{- default .Chart.Name (.Values.testbot).nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "xrengine.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}


{{- define "xrengine.taskserver.fullname" -}}
{{- if .Values.taskserver.fullnameOverride -}}
{{- .Values.taskserver.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Values.taskserver.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}


{{- define "xrengine.client.fullname" -}}
{{- if .Values.client.fullnameOverride -}}
{{- .Values.client.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Values.client.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}


{{- define "xrengine.api.fullname" -}}
{{- if .Values.api.fullnameOverride -}}
{{- .Values.api.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Values.api.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}


{{- define "xrengine.media.fullname" -}}
{{- if .Values.media.fullnameOverride -}}
{{- .Values.media.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Values.media.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "xrengine.instanceserver.fullname" -}}
{{- if .Values.instanceserver.fullnameOverride -}}
{{- .Values.instanceserver.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Values.instanceserver.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}


{{- define "xrengine.testbot.fullname" -}}
{{- if (.Values.testbot).fullnameOverride -}}
{{- .Values.testbot.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (.Values.testbot).name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "xrengine.client.host" -}}
{{- printf "%s.%s.%s" "dashboard" .Release.Name .Values.domain -}}
{{- end -}}


{{- define "xrengine.media.host" -}}
{{- printf "%s.%s.%s" "media" .Release.Name .Values.domain -}}
{{- end -}}



{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "xrengine.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "xrengine.taskserver.labels" -}}
helm.sh/chart: {{ include "xrengine.chart" . }}
{{ include "xrengine.taskserver.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "xrengine.taskserver.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xrengine.taskserver.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: taskserver
{{- end -}}

{{/*
Common labels
*/}}
{{- define "xrengine.client.labels" -}}
helm.sh/chart: {{ include "xrengine.chart" . }}
{{ include "xrengine.client.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "xrengine.client.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xrengine.client.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: client
{{- end -}}


{{/*
Common labels
*/}}
{{- define "xrengine.api.labels" -}}
helm.sh/chart: {{ include "xrengine.chart" . }}
{{ include "xrengine.api.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "xrengine.api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xrengine.api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: api
{{- end -}}


{{/*
Common labels
*/}}
{{- define "xrengine.media.labels" -}}
helm.sh/chart: {{ include "xrengine.chart" . }}
{{ include "xrengine.media.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "xrengine.media.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xrengine.media.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: media
{{- end -}}

{{/*
Common labels
*/}}
{{- define "xrengine.instanceserver.labels" -}}
helm.sh/chart: {{ include "xrengine.chart" . }}
{{ include "xrengine.instanceserver.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "xrengine.instanceserver.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xrengine.instanceserver.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: instanceserver
{{- end -}}


{{/*
Common labels
*/}}
{{- define "xrengine.testbot.labels" -}}
helm.sh/chart: {{ include "xrengine.chart" . }}
{{ include "xrengine.testbot.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "xrengine.testbot.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xrengine.testbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: testbot
{{- end -}}


{{/*
Create the name of the service account to use
*/}}
{{- define "xrengine.taskserver.serviceAccountName" -}}
{{- if .Values.taskserver.serviceAccount.create -}}
    {{ default (include "xrengine.taskserver.fullname" .) .Values.taskserver.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.taskserver.serviceAccount.name }}
{{- end -}}
{{- end -}}


{{/*
Create the name of the service account to use
*/}}
{{- define "xrengine.client.serviceAccountName" -}}
{{- if .Values.client.serviceAccount.create -}}
    {{ default (include "xrengine.client.fullname" .) .Values.client.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.client.serviceAccount.name }}
{{- end -}}
{{- end -}}


{{/*
Create the name of the service account to use
*/}}
{{- define "xrengine.api.serviceAccountName" -}}
{{- if .Values.api.serviceAccount.create -}}
    {{ default (include "xrengine.api.fullname" .) .Values.api.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.api.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "xrengine.media.serviceAccountName" -}}
{{- if .Values.media.serviceAccount.create -}}
    {{ default (include "xrengine.media.fullname" .) .Values.media.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.media.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "xrengine.instanceserver.serviceAccountName" -}}
{{- if .Values.instanceserver.serviceAccount.create -}}
    {{ default (include "xrengine.instanceserver.fullname" .) .Values.instanceserver.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.instanceserver.serviceAccount.name }}
{{- end -}}
{{- end -}}


{{/*
Create the name of the service account to use
*/}}
{{- define "xrengine.testbot.serviceAccountName" -}}
{{- if ((.Values.testbot).serviceAccount).create -}}
    {{ default (include "xrengine.testbot.fullname" .) .Values.testbot.serviceAccount.name }}
{{- else -}}
    {{ default "default" ((.Values.testbot).serviceAccount).name }}
{{- end -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "xrengine.mariadb.fullname" -}}
{{- if ((.Values.mariadb).fullnameOverride) -}}
{{- .Values.mariadb.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.mariadb.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}


{{/*
Set maria host
*/}}
{{- define "xrengine.mariadb.host" -}}
{{- if ((.Values.mariadb).enabled) -}}
{{- template "xrengine.mariadb.fullname" . -}}
{{- else if ((.Values.mariadb).externalHost) -}}
{{- .Values.mariadb.externalHost | quote -}}
{{- end -}}
{{- end -}}
