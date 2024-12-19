### **Documentation de la route : GET `/admin/all-alerts`**

---

### **Endpoint :**

`GET /admin/all-alerts`

---

### **Type de donnée :**

* **Requête** : `application/json`
* **Authentification** : Token JWT requis dans les headers.

---

### **Données à envoyer :**

#### **Headers :**

| **Champ**   | **Description**                                   | **Obligatoire** |
| ----------------- | ------------------------------------------------------- | --------------------- |
| `Authorization` | Token JWT au format `Bearer <token>`(administrateur). | Oui                   |

#### **Query Parameters (optionnels) :**

| **Champ** | **Type** | **Description**                         | **Obligatoire** |
| --------------- | -------------- | --------------------------------------------- | --------------------- |
| `limit`       | `integer`    | Nombre d'alertes par page (par défaut 10).   | Non                   |
| `offset`      | `integer`    | Décalage pour la pagination (par défaut 0). | Non                   |
| `category`    | `string`     | Filtrer les alertes par catégorie.           | Non                   |
| `status`      | `string`     | Filtrer les alertes par statut.               | Non                   |

**Exemple de requête :**

```http
GET /admin/all-alerts?limit=5&offset=0&status=PENDING HTTP/1.1
Host: http://46.202.170.228:3000
Authorization: Bearer <token>
```

---

### **Réponses :**

#### **1. Succès (HTTP 200)**

Si les alertes sont récupérées avec succès, un objet contenant les informations paginées des alertes est renvoyé.

| **Champ**                       | **Type** | **Description**                                   |
| ------------------------------------- | -------------- | ------------------------------------------------------- |
| `total`                             | `integer`    | Nombre total d'alertes disponibles.                     |
| `data`                              | `array`      | Liste paginée des alertes avec leurs relations.        |
| **Chaque objet dans `data`**: |                |                                                         |
| `id`                                | `string`     | Identifiant unique de l'alerte.                         |
| `status`                            | `string`     | Statut de l'alerte (`PENDING`,`IN_PROGRESS`, etc.). |
| `description`                       | `string`     | Description de l'alerte.                                |
| `reporter`                          | `object`     | Informations sur le citoyen ayant envoyé l'alerte.     |
| `media`                             | `array`      | Liste des médias liés à l'alerte (photos, vidéos).  |

**Exemple de réponse :**

```json
{
  "message": "Alertes récupérées avec succès",
  "data": {
    "total": 2,
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "status": "PENDING",
        "description": "Incendie signalé dans le quartier.",
        "reporter": {
          "id": "user-123",
          "first_name": "Jean",
          "last_name": "Dupont",
          "email": "jean.dupont@example.com"
        },
        "media": [
          {
            "id": "media-1",
            "media_type": "PHOTO",
            "media_url": "https://example.com/photo1.jpg"
          }
        ]
      }
    ]
  }
}
```

---

#### **2. Erreur : Non autorisé (HTTP 401)**

Si l'utilisateur n'est pas authentifié ou n'a pas le rôle `ADMIN`.

**Exemple de réponse :**

```json
{
  "message": "Accès interdit : seuls les administrateurs peuvent effectuer cette action",
  "data": null
}
```

---

#### **3. Erreur : Serveur (HTTP 500)**

Une erreur interne est survenue lors de la récupération des alertes.

**Exemple de réponse :**

```json
{
  "message": "Erreur lors de la récupération des alertes",
  "data": {
    "error": "Détails de l'erreur technique."
  }
}
```

---

### **Résumé des Statuts HTTP :**

| **Statut** | **Condition**                                 | **Message**                                                                |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| 200              | Les alertes sont récupérées avec succès         | `"Alertes récupérées avec succès"`                                         |
| 401              | Utilisateur non authentifié ou rôle non autorisé | `"Accès interdit : seuls les administrateurs peuvent effectuer cette action"` |
| 500              | Problème interne côté serveur                    | `"Erreur lors de la récupération des alertes"`                               |

---

### **Fonctionnalités :**

1. **Authentification :** Vérification obligatoire via le middleware `authenticate()` pour s'assurer que l'utilisateur est un administrateur.
2. **Pagination :** Supporte les paramètres `limit` et `offset` pour gérer les données paginées.
3. **Filtrage :** Possibilité de filtrer par `category` et `status`.
4. **Relations incluses :**
   * `reporter` : Détails du citoyen qui a signalé l'alerte.
   * `media` : Médias associés à l'alerte.

---

### **Notes supplémentaires :**

* **Tri par date de création** : Les alertes sont retournées dans l'ordre décroissant (de la plus récente à la plus ancienne).
* **Sécurité** : L'accès est strictement réservé aux administrateurs grâce à la vérification du rôle utilisateur.
